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
import { asArray } from "../../../../utils/utils";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";
import { getPathToNode } from "../utils/path-parser";
import { vectorDirective } from "../../../../graphql/directives/vector";

export function validateVectorDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, path, ancestors) {
            const { directives } = objectTypeDefinitionNode;
            const objectTypeExtensionNodes = typeMapWithExtensions[objectTypeDefinitionNode.name.value]?.extensions;
            const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
                return extensionNode.directives ?? [];
            });
            const allDirectives = [...(directives ?? []), ...extensionsDirectives];
            const vectorDirectiveOnNode = allDirectives.find(
                (directive) => directive.name.value === vectorDirective.name
            );
            if (!vectorDirectiveOnNode) {
                return;
            }
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, typeMapWithExtensions });
            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "@${vectorDirective.name}" must be in a type with "@node"`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);
            console.log("pathToNode", pathToNode);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToNode[0], objectTypeDefinitionNode.name.value],
                        errorMsg,
                    })
                );
            }
        },
    };
}
