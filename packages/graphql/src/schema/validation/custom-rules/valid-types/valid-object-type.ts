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

import type { ASTVisitor, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";

export function ValidObjectType(context: SDLValidationContext): ASTVisitor {
    return {
        ObjectTypeDefinition(objectType: ObjectTypeDefinitionNode) {
            const { isValid, errorMsg } = assertValid(() => assertValidType(objectType));
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectType],
                        errorMsg,
                    })
                );
            }
        },
        InterfaceTypeDefinition(interfaceType: InterfaceTypeDefinitionNode) {
            if (!interfaceType.directives?.some((d) => d.name.value === "relationshipProperties")) {
                // no need to run rule on interface types because their fields cannot contain the @private directive
                return;
            }
            const { isValid, errorMsg } = assertValid(() => assertValidType(interfaceType));

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [interfaceType],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertValidType(type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode) {
    if (!type.fields || !type.fields.length) {
        throw new DocumentValidationError("Objects and Interfaces must have one or more fields.", []);
    }
    const privateFieldsCount = type.fields.filter((f) => f.directives?.find((d) => d.name.value === "private")).length;
    const fieldsCount = type.fields.length;
    if (privateFieldsCount === fieldsCount) {
        throw new DocumentValidationError("Objects and Interfaces must have one or more fields.", []);
    }
}
