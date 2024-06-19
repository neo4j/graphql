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

import type { ASTVisitor, ObjectTypeDefinitionNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { limitDirective } from "../../../graphql/directives";
import { verifyLimit } from "../../../schema/validation/custom-rules/directives/limit";
import {
    assertValid,
    createGraphQLError,
} from "../../../schema/validation/custom-rules/utils/document-validation-error";
import { getPathToNode } from "../../../schema/validation/custom-rules/utils/path-parser";

export function ValidLimit(context: SDLValidationContext): ASTVisitor {
    return {
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, path, ancestors) {
            const { directives } = objectTypeDefinitionNode;
            if (!directives) {
                return;
            }
            const limitDirectiveNode = directives.find((directive) => directive.name.value === limitDirective.name);
            if (!limitDirectiveNode) {
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(() =>
                verifyLimit({ directiveNode: limitDirectiveNode })
            );
            const [pathToNode] = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToNode, objectTypeDefinitionNode.name.value, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}
