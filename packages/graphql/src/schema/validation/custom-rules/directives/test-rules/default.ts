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
import { GraphQLDate } from "graphql-compose";
import { GRAPHQL_BUILTIN_SCALAR_TYPES } from "../../../../../constants";
import { defaultDirective } from "../../../../../graphql/directives";
import { GraphQLDateTime, GraphQLLocalDateTime, GraphQLLocalTime, GraphQLTime } from "../../../../../graphql/scalars";
import type { Neo4jValidationContext, ObjectExtensionsTypeMap } from "../../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../../utils/document-validation-error";
import { getPathToNode } from "../../utils/path-parser";
import { assertArgumentHasSameTypeAsField } from "../../utils/same-type-argument-as-field";
import { fieldIsInNodeType, fieldIsInRelationshipPropertiesType } from "./check-if-location-is-valid";

export function validateDefaultDirective(context: Neo4jValidationContext): ASTVisitor {
    const extensionsTypeMap = context.extensionsTypeMap;
    if (!extensionsTypeMap) {
        throw new Error("No extensionsTypeMap found in the context");
    }
    // TODO: if this is needed to other validation rules, we could move these to the context
    const enumsTypes: EnumTypeDefinitionNode[] = Object.values(extensionsTypeMap)
        .map((type) => type.definition)
        .filter((definition): definition is EnumTypeDefinitionNode => definition.kind === Kind.ENUM_TYPE_DEFINITION);

    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const defDirective = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === defaultDirective.name
            );
            if (!defDirective) {
                return;
            }
            const valueArg = defDirective.arguments?.find((arg) => arg.name.value === "value");
            if (!valueArg) {
                return;
            }
            const isValidLocation =
                fieldIsInNodeType({ path, ancestors, extensionsTypeMap }) ||
                fieldIsInRelationshipPropertiesType({ path, ancestors, extensionsTypeMap });

            const { isValid, errorMsg, errorPath } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${defaultDirective.name}" requires to be used within the "@node" directive or within the "@relationshipProperties" directive`,
                        []
                    );
                }
                assertTypeIsSupportedByDefault(fieldDefinitionNode.type, extensionsTypeMap);
                // for compatibility with previous helper we generate the enumTypes here, but it can be passed the typeMap instead.
                assertArgumentHasSameTypeAsField({
                    directiveName: defaultDirective.name,
                    traversedDef: fieldDefinitionNode,
                    argument: valueArg,
                    enums: enumsTypes,
                });
            });
            const pathToHere = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToHere[0], `@${defaultDirective.name}`, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertTypeIsSupportedByDefault(typeNode: TypeNode, extensionsTypeMap: ObjectExtensionsTypeMap) {
    if (typeNode.kind === Kind.LIST_TYPE) {
        assertTypeIsSupportedByDefault(typeNode.type, extensionsTypeMap);
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        assertTypeIsSupportedByDefault(typeNode.type, extensionsTypeMap);
    }

    if (typeNode.kind === Kind.NAMED_TYPE) {
        if (
            GRAPHQL_BUILTIN_SCALAR_TYPES.includes(typeNode.name.value) ||
            [
                GraphQLDateTime.name,
                GraphQLLocalDateTime.name,
                GraphQLDate.name,
                GraphQLTime.name,
                GraphQLLocalTime.name,
            ].includes(typeNode.name.value) ||
            typeNode.name.value === BigInt.name
        ) {
            return;
        }

        // check if the type is an enum
        const typeFromMap = extensionsTypeMap[typeNode.name.value];
        if (typeFromMap?.definition.kind === Kind.ENUM_TYPE_DEFINITION) {
            return;
        }

        throw new DocumentValidationError(
            `@${defaultDirective.name} directive can only be used on fields of type Int, Float, String, Boolean, ID, BigInt, DateTime, Date, Time, LocalDateTime or LocalTime.`,
            []
        );
    }
}
