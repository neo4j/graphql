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

import type { ASTVisitor, DirectiveNode, InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { limitDirective } from "../../../../graphql/directives";
import { asArray } from "../../../../utils/utils";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import type { AssertionResponse } from "../utils/document-validation-error";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";
import { parseArgumentToInt } from "../utils/utils";

export function validateLimitDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        InterfaceTypeDefinition(
            interfaceTypeDefinitionNode: InterfaceTypeDefinitionNode,
            _key,
            _parent,
            _path,
            _ancestors
        ) {
            const { directives } = interfaceTypeDefinitionNode;
            const objectTypeExtensionNodes = typeMapWithExtensions[interfaceTypeDefinitionNode.name.value]?.extensions;
            const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
                return extensionNode.directives ?? [];
            });
            const allDirectives = [...(directives ?? []), ...extensionsDirectives];
            const appliedLimitDirective = allDirectives.find(
                (directive) => directive.name.value === limitDirective.name
            );
            if (!appliedLimitDirective) {
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(() => {
                assertLimitDirectiveIsValid(appliedLimitDirective);
            });
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [interfaceTypeDefinitionNode],
                        path: [interfaceTypeDefinitionNode.name.value, `@${limitDirective.name}`, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, _path, _ancestors) {
            const { directives } = objectTypeDefinitionNode;
            const objectTypeExtensionNodes = typeMapWithExtensions[objectTypeDefinitionNode.name.value]?.extensions;
            const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
                return extensionNode.directives ?? [];
            });
            const allDirectives = [...(directives ?? []), ...extensionsDirectives];
            const appliedLimitDirective = allDirectives.find(
                (directive) => directive.name.value === limitDirective.name
            );
            if (!appliedLimitDirective) {
                return;
            }
            const { isValid, errorMsg, errorPath } = assertValid(() => {
                const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, typeMapWithExtensions });
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${limitDirective.name}" must be in a type with "@node" or in an interface type`,
                        []
                    );
                }
                assertLimitDirectiveIsValid(appliedLimitDirective);
            });
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [objectTypeDefinitionNode.name.value, `@${limitDirective.name}`, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

// shared assertion code between limit validation between interface and object types
function assertLimitDirectiveIsValid(appliedLimitDirective: DirectiveNode): AssertionResponse | undefined {
    const defaultArg = appliedLimitDirective.arguments?.find((a) => a.name.value === "default");
    const maxArg = appliedLimitDirective.arguments?.find((a) => a.name.value === "max");
    if (!defaultArg && !maxArg) {
        // nothing to check, fields are optional
        return;
    }
    const defaultLimit = parseArgumentToInt(defaultArg);
    const maxLimit = parseArgumentToInt(maxArg);

    if (defaultLimit) {
        const defaultValue = defaultLimit.toNumber();
        // default must be greater than 0
        if (defaultValue <= 0) {
            throw new DocumentValidationError(
                `@${limitDirective.name}.default invalid value: ${defaultValue}. Must be greater than 0.`,
                ["default"]
            );
        }
    }
    if (maxLimit) {
        const maxValue = maxLimit.toNumber();
        // max must be greater than 0
        if (maxValue <= 0) {
            throw new DocumentValidationError(
                `@${limitDirective.name}.max invalid value: ${maxValue}. Must be greater than 0.`,
                ["max"]
            );
        }
    }
    if (defaultLimit && maxLimit) {
        const defaultValue = defaultLimit.toNumber();
        const maxValue = maxLimit.toNumber();
        // default must be smaller than max
        if (maxLimit < defaultLimit) {
            throw new DocumentValidationError(
                `@${limitDirective.name}.max invalid value: ${maxValue}. Must be greater than limit.default: ${defaultValue}.`,
                ["max"]
            );
        }
    }
}
