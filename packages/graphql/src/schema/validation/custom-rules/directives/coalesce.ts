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

import type { ASTVisitor, EnumTypeDefinitionNode, FieldDefinitionNode, TypeNode } from "graphql";
import { Kind } from "graphql";
import { GRAPHQL_BUILTIN_SCALAR_TYPES, SPATIAL_TYPES, TEMPORAL_SCALAR_TYPES } from "../../../../constants";
import { coalesceDirective } from "../../../../graphql/directives";
import type { Neo4jValidationContext, TypeMapWithExtensions } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInRelationshipPropertiesType } from "../utils/location-helpers/is-in-relationship-properties-type";
import { getPathToNode } from "../utils/path-parser";
import { assertArgumentHasSameTypeAsField } from "../utils/same-type-argument-as-field";

export function validateCoalesceDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    const enumsTypes: EnumTypeDefinitionNode[] = Object.values(typeMapWithExtensions)
        .map((type) => type.definition)
        .filter((definition): definition is EnumTypeDefinitionNode => definition.kind === Kind.ENUM_TYPE_DEFINITION);

    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const coalesce = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === coalesceDirective.name
            );
            if (!coalesce) {
                return;
            }
            const valueArg = coalesce.arguments?.find((arg) => arg.name.value === "value");
            if (!valueArg) {
                return;
            }
            const isValidLocation =
                fieldIsInNodeType({ path, ancestors, typeMapWithExtensions }) ||
                fieldIsInRelationshipPropertiesType({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg, errorPath } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive @"${coalesceDirective.name}" must be in a type with "@node" or within the "@relationshipProperties" directive`,
                        []
                    );
                }
                assertTypeIsSupportedByCoalesce(fieldDefinitionNode.type, typeMapWithExtensions);
                // for compatibility with previous helper we generate the enumTypes here, but it can be passed the typeMap instead.
                assertArgumentHasSameTypeAsField({
                    directiveName: coalesceDirective.name,
                    traversedDef: fieldDefinitionNode,
                    argument: valueArg,
                    enums: enumsTypes,
                });
            });

            if (!isValid) {
                const pathToNode = getPathToNode(path, ancestors);
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${coalesceDirective.name}`, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertTypeIsSupportedByCoalesce(typeNode: TypeNode, typeMapWithExtensions: TypeMapWithExtensions): void {
    if (typeNode.kind === Kind.LIST_TYPE) {
        assertTypeIsSupportedByCoalesce(typeNode.type, typeMapWithExtensions);
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        assertTypeIsSupportedByCoalesce(typeNode.type, typeMapWithExtensions);
    }

    if (typeNode.kind === Kind.NAMED_TYPE) {
        if (GRAPHQL_BUILTIN_SCALAR_TYPES.includes(typeNode.name.value)) {
            return;
        }

        if (SPATIAL_TYPES.includes(typeNode.name.value)) {
            throw new DocumentValidationError(`@${coalesceDirective.name} is not supported by Spatial types.`, []);
        }

        if (TEMPORAL_SCALAR_TYPES.includes(typeNode.name.value)) {
            throw new DocumentValidationError(`@${coalesceDirective.name} is not supported by Temporal types.`, []);
        }
        // check if the type is an enum
        const typeFromMap = typeMapWithExtensions[typeNode.name.value];
        if (typeFromMap?.definition.kind === Kind.ENUM_TYPE_DEFINITION) {
            return;
        }

        throw new DocumentValidationError(
            `@${coalesceDirective.name} directive can only be used on types: Int | Float | String | Boolean | ID | Enum`,
            []
        );
    }
}
