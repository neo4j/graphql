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

import type { ASTVisitor, FieldDefinitionNode, NamedTypeNode, TypeNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { relationshipDirective } from "../../../graphql/directives";
import {
    GraphQLBuiltInScalarType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
} from "../../../schema-model/attribute/AttributeType";
import {
    DocumentValidationError,
    assertValid,
    createGraphQLError,
} from "../../../schema/validation/custom-rules/utils/document-validation-error";
import { getPathToNode } from "../../../schema/validation/custom-rules/utils/path-parser";

export function ValidRelationship(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const { type, directives } = fieldDefinitionNode;
            if (!directives) {
                return;
            }
            const relationshipDirectiveNode = directives.find(
                (directive) => directive.name.value === relationshipDirective.name
            );
            if (!relationshipDirectiveNode) {
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(() => assertIsValidTargetForRelationship(type));
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
/**
 * Check the following condition:
 * Target is of type List and elements are non-nullable.
 * Wrapped Type is of type ObjectType.
 **/
function assertIsValidTargetForRelationship(type: TypeNode): void {
    if (type.kind === Kind.NON_NULL_TYPE) {
        return assertIsValidTargetForRelationship(type.type);
    }
    if (type.kind !== Kind.LIST_TYPE) {
        throw new DocumentValidationError(`@relationship can only be used on List target`, []);
    }
    const innerType = type.type;
    const wrappedType = getWrappedKind(innerType);
    const wrappedTypeName = wrappedType.name.value;
    assertIsNotInBuiltInTypes(wrappedType);
    if (innerType.kind !== Kind.NON_NULL_TYPE) {
        const nullableListErrorMessage = `Invalid field type: List type relationship fields must be non-nullable and have non-nullable entries, please change type to [${wrappedTypeName}!]!`;
        throw new DocumentValidationError(nullableListErrorMessage, []);
    }
}

function assertIsNotInBuiltInTypes(type: NamedTypeNode): void {
    if (typeInBuiltInTypes(type)) {
        throw new DocumentValidationError(`@relationship cannot be used with type: ${type.name.value}`, []);
    }
}

function typeInBuiltInTypes(type: NamedTypeNode): boolean {
    return [GraphQLBuiltInScalarType, Neo4jGraphQLSpatialType, Neo4jGraphQLNumberType, Neo4jGraphQLTemporalType].some(
        (typeEnum) => typeEnum[typeEnum[type.name.value]]
    );
}

function getWrappedKind(typeNode: TypeNode): NamedTypeNode {
    if (typeNode.kind === Kind.LIST_TYPE) {
        return getWrappedKind(typeNode.type);
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        return getWrappedKind(typeNode.type);
    }
    return typeNode;
}
