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
    DefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeExtensionNode,
    InterfaceTypeExtensionNode,
} from "graphql";
import type { EnricherContext } from "../EnricherContext";
import type { Enricher } from "../types";

type ObjectOrInterfaceDefinitionNode = ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
type ObjectOrInterfaceExtensionNode = ObjectTypeExtensionNode | InterfaceTypeExtensionNode;
type ObjectLikeDefinitionNode = ObjectOrInterfaceDefinitionNode | ObjectOrInterfaceExtensionNode;

function getAuthenticationDirectiveDefinition(typeDefinitionNode: ObjectLikeDefinitionNode | FieldDefinitionNode) {
    return typeDefinitionNode.directives?.find((directive) => directive.name.value === "authentication");
}

function containsAuthentication(object: ObjectLikeDefinitionNode): boolean {
    switch (object.kind) {
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.OBJECT_TYPE_DEFINITION: {
            return !!(
                getAuthenticationDirectiveDefinition(object) ||
                (!!object.fields && object.fields.some(getAuthenticationDirectiveDefinition))
            );
        }
        default:
            return false;
    }
}

function changeAuthenticationDirectiveOnField(
    field: FieldDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): FieldDefinitionNode {
    const userField = userDocumentObject.fields?.find(
        (userDefinitionField) => field.name.value === userDefinitionField.name.value
    );
    const userFieldAuthorizationDirective = userField && getAuthenticationDirectiveDefinition(userField);
    if (!userFieldAuthorizationDirective) {
        return field;
    }
    const fieldAuthorizationDirective = userFieldAuthorizationDirective;
    return { ...field, directives: (field.directives ?? []).concat(fieldAuthorizationDirective) };
}

function changeAuthenticationirectiveOnObject(
    object: ObjectOrInterfaceDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): ObjectOrInterfaceDefinitionNode {
    const userAuthorizationDirective = getAuthenticationDirectiveDefinition(userDocumentObject);
    const fieldsWithNewAuthorizationDirective = object.fields?.map((field) =>
        changeAuthenticationDirectiveOnField(field, userDocumentObject)
    );
    const newDirectiveDirective = userAuthorizationDirective;
    return {
        ...object,
        directives: newDirectiveDirective ? (object.directives ?? []).concat(newDirectiveDirective) : object.directives,
        fields: fieldsWithNewAuthorizationDirective,
    };
}

export function authenticationDirectiveEnricher(enricherContext: EnricherContext): Enricher {
    return (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => {
        switch (definition.kind) {
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const userDocumentObject = enricherContext.userDefinitionNodeMap[typeName] as
                    | ObjectOrInterfaceDefinitionNode
                    | undefined;
                const userDocumentExtensions = enricherContext.userDefinitionNodeMap[`${typeName}_EXTENSIONS`] as
                    | Array<ObjectOrInterfaceExtensionNode>
                    | undefined;
                if (userDocumentObject) {
                    let definitionWithEnrichedAuthorization = containsAuthentication(userDocumentObject)
                        ? changeAuthenticationirectiveOnObject(definition, userDocumentObject)
                        : definition;
                    if (userDocumentExtensions) {
                        definitionWithEnrichedAuthorization = userDocumentExtensions.reduce((prev, curr) => {
                            return containsAuthentication(curr)
                                ? changeAuthenticationirectiveOnObject(prev, curr)
                                : prev;
                        }, definitionWithEnrichedAuthorization);
                    }
                    accumulatedDefinitions.push(definitionWithEnrichedAuthorization);
                    return accumulatedDefinitions;
                }
            }
        }
        accumulatedDefinitions.push(definition);
        return accumulatedDefinitions;
    };
}
