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
import { createAuthorizationDefinitions } from "../../../graphql/directives/type-dependant-directives/authorization";
import type { EnricherContext } from "../EnricherContext";
import type { Enricher } from "../types";

type ObjectOrInterfaceDefinitionNode = ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
type ObjectOrInterfaceExtensionNode = ObjectTypeExtensionNode | InterfaceTypeExtensionNode;
type ObjectLikeDefinitionNode = ObjectOrInterfaceDefinitionNode | ObjectOrInterfaceExtensionNode;

function getAuthorizationDirectiveDefinition(typeDefinitionNode: ObjectLikeDefinitionNode | FieldDefinitionNode) {
    return typeDefinitionNode.directives?.find((directive) => directive.name.value === "authorization");
}

function containsAuthorization(object: ObjectLikeDefinitionNode): boolean {
    switch (object.kind) {
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.OBJECT_TYPE_DEFINITION: {
            return !!(
                getAuthorizationDirectiveDefinition(object) ||
                (!!object.fields && object.fields.some(getAuthorizationDirectiveDefinition))
            );
        }
        default:
            return false;
    }
}

// currentDirectiveDirective is of type ConstDirectiveNode, has to be any to support GraphQL 15
function getAuthorizationDirective(currentDirectiveDirective: any, typeName: string) {
    return {
        ...currentDirectiveDirective,
        name: {
            kind: Kind.NAME,
            value: `${typeName}Authorization`,
        },
    };
}

function changeAuthorizationDirectiveOnField(
    field: FieldDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): FieldDefinitionNode {
    const userField = userDocumentObject.fields?.find(
        (userDefinitionField) => field.name.value === userDefinitionField.name.value
    );
    const userFieldAuthorizationDirective = userField && getAuthorizationDirectiveDefinition(userField);
    if (!userFieldAuthorizationDirective) {
        return field;
    }
    const fieldAuthorizationDirective = getAuthorizationDirective(
        userFieldAuthorizationDirective,
        userDocumentObject.name.value
    );
    return { ...field, directives: (field.directives ?? []).concat(fieldAuthorizationDirective) };
}

function changeAuthorizationDirectiveOnObject(
    object: ObjectOrInterfaceDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): ObjectOrInterfaceDefinitionNode {
    const userAuthorizationDirective = getAuthorizationDirectiveDefinition(userDocumentObject);
    const fieldsWithNewAuthorizationDirective = object.fields?.map((field) =>
        changeAuthorizationDirectiveOnField(field, userDocumentObject)
    );
    const newDirectiveDirective =
        userAuthorizationDirective && getAuthorizationDirective(userAuthorizationDirective, object.name.value);
    return {
        ...object,
        directives: newDirectiveDirective ? (object.directives ?? []).concat(newDirectiveDirective) : object.directives,
        fields: fieldsWithNewAuthorizationDirective,
    };
}

function findAuthorizationDirectiveByTypeName(typeName: string, enricherContext: EnricherContext): boolean {
    const userDocumentObject = enricherContext.userDefinitionNodeMap[typeName] as
        | ObjectOrInterfaceDefinitionNode
        | undefined;
    const userDocumentExtensions = enricherContext.userDefinitionNodeMap[
        `${userDocumentObject?.name.value}_EXTENSIONS`
    ] as Array<ObjectOrInterfaceExtensionNode> | undefined;
    if (
        (userDocumentObject && containsAuthorization(userDocumentObject)) ||
        (userDocumentExtensions && userDocumentExtensions.find(containsAuthorization))
    ) {
        return true;
    }
    return false;
}

// Enriches the directive definition itself
export function authorizationDefinitionsEnricher(enricherContext: EnricherContext): Enricher {
    return (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => {
        switch (definition.kind) {
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const hasAuthorization = findAuthorizationDirectiveByTypeName(typeName, enricherContext);
                if (hasAuthorization) {
                    const authDefinitions = createAuthorizationDefinitions(typeName, enricherContext.augmentedSchema);
                    accumulatedDefinitions.push(...authDefinitions);
                }
            }
        }
        accumulatedDefinitions.push(definition);
        return accumulatedDefinitions;
    };
}

// Enriches the applied directives on objects, interfaces and fields
export function authorizationDirectiveEnricher(enricherContext: EnricherContext): Enricher {
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
                    let definitionWithEnrichedAuthorization = containsAuthorization(userDocumentObject)
                        ? changeAuthorizationDirectiveOnObject(definition, userDocumentObject)
                        : definition;
                    if (userDocumentExtensions) {
                        definitionWithEnrichedAuthorization = userDocumentExtensions.reduce((prev, curr) => {
                            return containsAuthorization(curr)
                                ? changeAuthorizationDirectiveOnObject(prev, curr)
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
