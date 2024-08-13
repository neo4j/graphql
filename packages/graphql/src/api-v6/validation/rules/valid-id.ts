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
import { GraphQLID, Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { idDirective } from "../../../graphql/directives";
import {
    assertValid,
    createGraphQLError,
    DocumentValidationError,
} from "../../../schema/validation/custom-rules/utils/document-validation-error";
import { getPathToNode } from "../../../schema/validation/custom-rules/utils/path-parser";
import type { TypePath } from "./types";
import { findTypePathInTypePaths } from "./utils/find-type-path-in-type-paths";
import { getTypePath } from "./utils/get-type-path";

export function ValidID(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const { directives, type } = fieldDefinitionNode;
            if (!directives) {
                return;
            }
            const idAnnotation = directives.find((directive) => directive.name.value === idDirective.name);

            if (!idAnnotation) {
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(() => {
                const validTypePaths: TypePath[] = [[GraphQLID.name], [Kind.NON_NULL_TYPE, GraphQLID.name]];
                const typePath = getTypePath(type);
                if (!findTypePathInTypePaths(typePath, validTypePaths)) {
                    if (typePath.includes(Kind.LIST_TYPE)) {
                        throw new DocumentValidationError("Cannot autogenerate an array.", ["@id"]);
                    }
                    throw new DocumentValidationError("Cannot autogenerate a non ID field.", ["@id"]);
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
