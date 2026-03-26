/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type {
    FieldDefinitionNode,
    GraphQLSchema,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { Kind } from "graphql";

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
