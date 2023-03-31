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
            const hasFields = !!object.fields;
            return !!(
                getAuthorizationDirectiveDefinition(object) ||
                (hasFields && object.fields.some(getAuthorizationDirectiveDefinition))
            );
        }
        default:
            return false;
    }
}

function getAuthorizationUsage(currentDirectiveUsage: any, typeName: string) {
    return {
        ...currentDirectiveUsage,
        name: {
            kind: Kind.NAME,
            value: `${typeName}Authorization`,
        },
    };
}

function changeAuthorizationUsageOnField(
    field: FieldDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): FieldDefinitionNode {
    const userField = userDocumentObject.fields?.find(
        (userDefinitionField) => field.name.value === userDefinitionField.name.value
    );
    const userFieldAuthorizationUsage = userField && getAuthorizationDirectiveDefinition(userField);
    if (!userFieldAuthorizationUsage) {
        return field;
    }
    const fieldAuthorizationUsage = getAuthorizationUsage(userFieldAuthorizationUsage, userDocumentObject.name.value);
    return { ...field, directives: (field.directives ?? []).concat(fieldAuthorizationUsage) };
}

function changeAuthorizationUsageOnObject(
    object: ObjectOrInterfaceDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): ObjectOrInterfaceDefinitionNode {
    const userAuthorizationUsage = getAuthorizationDirectiveDefinition(userDocumentObject);
    const fieldsWithNewAuthorizationUsage = object.fields?.map((field) =>
        changeAuthorizationUsageOnField(field, userDocumentObject)
    );
    const newDirectiveUsage =
        userAuthorizationUsage && getAuthorizationUsage(userAuthorizationUsage, object.name.value);
    return {
        ...object,
        directives: newDirectiveUsage ? (object.directives ?? []).concat(newDirectiveUsage) : object.directives,
        fields: fieldsWithNewAuthorizationUsage,
    };
}

function findAuthorizationUsageByTypeName(typeName: string, enricherContext: EnricherContext): boolean {
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

export function authorizationDefinitionsEnricher(enricherContext: EnricherContext): Enricher {
    return (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => {
        switch (definition.kind) {
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const hasAuthorization = findAuthorizationUsageByTypeName(typeName, enricherContext);
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

export function authorizationUsageEnricher(enricherContext: EnricherContext): Enricher {
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
                        ? changeAuthorizationUsageOnObject(definition, userDocumentObject)
                        : definition;
                    if (userDocumentExtensions) {
                        definitionWithEnrichedAuthorization = userDocumentExtensions.reduce((prev, curr) => {
                            return containsAuthorization(curr) ? changeAuthorizationUsageOnObject(prev, curr) : prev;
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
