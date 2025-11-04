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
import { Kind } from "graphql";
import type {
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeExtensionNode,
    InterfaceTypeExtensionNode,
    GraphQLSchema,
} from "graphql";

export type ObjectOrInterfaceDefinitionNode = ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
export type ObjectOrInterfaceExtensionNode = ObjectTypeExtensionNode | InterfaceTypeExtensionNode;
type ObjectLikeDefinitionNode = ObjectOrInterfaceDefinitionNode | ObjectOrInterfaceExtensionNode;

export type DIRECTIVE_TRANSFORM_FN = (currentDirectiveDirective: any, typeName: string) => any;
export type CREATE_DIRECTIVE_DEFINITION_FN = (typeDefinitionName: string, schema: GraphQLSchema) => any;

export function containsDirective(object: ObjectLikeDefinitionNode, directiveName: string): boolean {
    switch (object.kind) {
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.OBJECT_TYPE_DEFINITION: {
            return !!(
                getDirectiveDefinition(object, directiveName) ||
                (!!object.fields && object.fields.some((field) => getDirectiveDefinition(field, directiveName)))
            );
        }
        default:
            return false;
    }
}

export function getDirectiveDefinition(
    typeDefinitionNode: ObjectLikeDefinitionNode | FieldDefinitionNode,
    directiveName: string
) {
    return typeDefinitionNode.directives?.find((directive) => directive.name.value === directiveName);
}
