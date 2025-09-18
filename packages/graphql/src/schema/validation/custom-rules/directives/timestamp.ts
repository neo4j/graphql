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
import { timestampDirective } from "../../../../graphql/directives";
import { GraphQLDateTime, GraphQLTime } from "../../../../graphql/scalars";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInRelationshipPropertiesType } from "../utils/location-helpers/is-in-relationship-properties-type";
import { getPathToNode } from "../utils/path-parser";

export function validateTimestampDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            if (
                !fieldDefinitionNode.directives?.find((directive) => directive.name.value === timestampDirective.name)
            ) {
                return;
            }
            const isValidLocation =
                fieldIsInNodeType({ path, ancestors, typeMapWithExtensions }) ||
                fieldIsInRelationshipPropertiesType({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${timestampDirective.name}" must be in a type with "@node" or within the "@relationshipProperties" directive`,
                        []
                    );
                }
                assertTypeIsSupportedByTimestamp(fieldDefinitionNode.type);
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${timestampDirective.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertTypeIsSupportedByTimestamp(type: TypeNode): void {
    if (type.kind === Kind.NON_NULL_TYPE) {
        return assertTypeIsSupportedByTimestamp(type.type);
    }
    if (type.kind === Kind.LIST_TYPE) {
        throw new DocumentValidationError("Cannot autogenerate an array.", [`@${timestampDirective.name}`]);
    }

    if (![GraphQLDateTime.name, GraphQLTime.name].includes(type.name.value)) {
        throw new DocumentValidationError("Cannot timestamp Temporal fields lacking time zone information.", [
            `@${timestampDirective.name}`,
        ]);
    }
}
