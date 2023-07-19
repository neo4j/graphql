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

import type { FieldDefinitionNode, TypeNode, DirectiveNode } from "graphql";
import { Kind } from "graphql";
import { filterTruthy } from "../../utils/utils";
import type { Annotation } from "../annotation/Annotation";
import type { AttributeType, Neo4jGraphQLScalarType } from "../attribute/AttributeType";
import {
    ScalarType,
    EnumType,
    UserScalarType,
    ObjectType,
    UnionType,
    InterfaceType,
    ListType,
    GraphQLBuiltInScalarType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLTemporalType,
} from "../attribute/AttributeType";
import { Attribute } from "../attribute/Attribute";
import { Field } from "../attribute/Field";
import { parseAuthenticationAnnotation } from "./annotations-parser/authentication-annotation";
import { parseAuthorizationAnnotation } from "./annotations-parser/authorization-annotation";
import { parseCypherAnnotation } from "./annotations-parser/cypher-annotation";
import type { DefinitionCollection } from "./definition-collection";
import { parseSubscriptionsAuthorizationAnnotation } from "./annotations-parser/subscriptions-authorization-annotation";

// TODO: figure out difference between field and attribute
export function parseAttribute(
    field: FieldDefinitionNode,
    definitionCollection: DefinitionCollection
): Attribute | Field {
    const name = field.name.value;
    const type = parseTypeNode(definitionCollection, field.type);
    const annotations = createFieldAnnotations(field.directives || []);

    return new Attribute({
        name,
        annotations,
        type,
    });
}

export function parseField(field: FieldDefinitionNode): Field {
    const name = field.name.value;
    const annotations = createFieldAnnotations(field.directives || []);
    return new Field({
        name,
        annotations,
    });
}

function parseTypeNode(
    definitionCollection: DefinitionCollection,
    typeNode: TypeNode,
    isRequired = false
): AttributeType {
    switch (typeNode.kind) {
        case Kind.NAMED_TYPE: {
            if (isScalarType(typeNode.name.value)) {
                return new ScalarType(typeNode.name.value, isRequired);
            } else if (isEnum(definitionCollection, typeNode.name.value)) {
                return new EnumType(typeNode.name.value, isRequired);
            } else if (isUserScalar(definitionCollection, typeNode.name.value)) {
                return new UserScalarType(typeNode.name.value, isRequired);
            } else if (isObject(definitionCollection, typeNode.name.value)) {
                return new ObjectType(typeNode.name.value, isRequired);
            } else if (isUnion(definitionCollection, typeNode.name.value)) {
                return new UnionType(typeNode.name.value, isRequired);
            } else if (isInterface(definitionCollection, typeNode.name.value)) {
                return new InterfaceType(typeNode.name.value, isRequired);
            } else {
                throw new Error(`Error while parsing Attribute with name: ${typeNode.name.value}`);
            }
        }

        case Kind.LIST_TYPE: {
            const innerType = parseTypeNode(definitionCollection, typeNode.type);
            return new ListType(innerType, isRequired);
        }
        case Kind.NON_NULL_TYPE:
            return parseTypeNode(definitionCollection, typeNode.type, true);
    }
}

function isInterface(definitionCollection: DefinitionCollection, name: string): boolean {
    return definitionCollection.interfaceTypes.has(name);
}

function isUnion(definitionCollection: DefinitionCollection, name: string): boolean {
    return definitionCollection.unionTypes.has(name);
}

function isEnum(definitionCollection: DefinitionCollection, name: string): boolean {
    return definitionCollection.enumTypes.has(name);
}

function isUserScalar(definitionCollection: DefinitionCollection, name: string) {
    return definitionCollection.scalarTypes.has(name);
}

function isObject(definitionCollection, name: string) {
    return definitionCollection.nodes.has(name);
}

function isScalarType(value: string): value is GraphQLBuiltInScalarType | Neo4jGraphQLScalarType {
    return (
        isGraphQLBuiltInScalar(value) ||
        isNeo4jGraphQLSpatialType(value) ||
        isNeo4jGraphQLNumberType(value) ||
        isNeo4jGraphQLTemporalType(value)
    );
}

function isGraphQLBuiltInScalar(value: string): value is GraphQLBuiltInScalarType {
    return Object.values<string>(GraphQLBuiltInScalarType).includes(value);
}

function isNeo4jGraphQLSpatialType(value: string): value is Neo4jGraphQLSpatialType {
    return Object.values<string>(Neo4jGraphQLSpatialType).includes(value);
}

function isNeo4jGraphQLNumberType(value: string): value is Neo4jGraphQLNumberType {
    return Object.values<string>(Neo4jGraphQLNumberType).includes(value);
}

function isNeo4jGraphQLTemporalType(value: string): value is Neo4jGraphQLTemporalType {
    return Object.values<string>(Neo4jGraphQLTemporalType).includes(value);
}

function createFieldAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "cypher":
                    return parseCypherAnnotation(directive);
                case "authorization":
                    return parseAuthorizationAnnotation(directive);
                case "authentication":
                    return parseAuthenticationAnnotation(directive);
                case "subscriptionsAuthorization":
                    return parseSubscriptionsAuthorizationAnnotation(directive);
                default:
                    return undefined;
            }
        })
    );
}
