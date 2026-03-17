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

import type { ASTNode, ASTVisitor, FieldDefinitionNode } from "graphql";
import { groupByDirective } from "../../../../graphql/directives";
import type { Neo4jValidationContext, TypeMapWithExtensions } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInSubscriptionType } from "../utils/location-helpers/is-in-subscription-type";
import { getPathToNode } from "../utils/path-parser";

export function validateGroupByDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            if (
                !fieldDefinitionNode.directives?.length ||
                !fieldDefinitionNode.directives.find((directive) => directive.name.value === groupByDirective.name)
            ) {
                return;
            }

            const isValidLocation = isGroupByLocationValid({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Invalid directive usage: Directive "@${groupByDirective.name}" should be in a type with "@node"`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${groupByDirective.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function isGroupByLocationValid(directiveLocationData: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    if (fieldIsInSubscriptionType(directiveLocationData)) {
        return false;
    }

    return fieldIsInNodeType(directiveLocationData);
    // || fieldIsInRelationshipPropertiesType(directiveLocationData)
}
