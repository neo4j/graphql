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
import { createSubscriptionsAuthorizationDefinitions } from "../../../graphql/directives/type-dependant-directives/subscriptions-authorization";

type ObjectOrInterfaceDefinitionNode = ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
type ObjectOrInterfaceExtensionNode = ObjectTypeExtensionNode | InterfaceTypeExtensionNode;
type ObjectLikeDefinitionNode = ObjectOrInterfaceDefinitionNode | ObjectOrInterfaceExtensionNode;

function getSubscriptionsAuthorizationDirectiveDefinition(
    typeDefinitionNode: ObjectLikeDefinitionNode | FieldDefinitionNode
) {
    return typeDefinitionNode.directives?.find((directive) => directive.name.value === "subscriptionsAuthorization");
}

function containsSubscriptionsAuthorization(object: ObjectLikeDefinitionNode): boolean {
    switch (object.kind) {
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.OBJECT_TYPE_DEFINITION: {
            return !!(
                getSubscriptionsAuthorizationDirectiveDefinition(object) ||
                (!!object.fields && object.fields.some(getSubscriptionsAuthorizationDirectiveDefinition))
            );
        }
        default:
            return false;
    }
}

function getSubscriptionsAuthorizationDirective(currentDirectiveDirective: any, typeName: string) {
    return {
        ...currentDirectiveDirective,
        name: {
            kind: Kind.NAME,
            value: `${typeName}SubscriptionsAuthorization`,
        },
    };
}

function changeSubscriptionsAuthorizationDirectiveOnField(
    field: FieldDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): FieldDefinitionNode {
    const userField = userDocumentObject.fields?.find(
        (userDefinitionField) => field.name.value === userDefinitionField.name.value
    );
    const userFieldAuthorizationDirective = userField && getSubscriptionsAuthorizationDirectiveDefinition(userField);
    if (!userFieldAuthorizationDirective) {
        return field;
    }
    const fieldAuthorizationDirective = getSubscriptionsAuthorizationDirective(
        userFieldAuthorizationDirective,
        userDocumentObject.name.value
    );
    return { ...field, directives: (field.directives ?? []).concat(fieldAuthorizationDirective) };
}

function changeSubscriptionsAuthorizationDirectiveOnObject(
    object: ObjectOrInterfaceDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode
): ObjectOrInterfaceDefinitionNode {
    const userAuthorizationDirective = getSubscriptionsAuthorizationDirectiveDefinition(userDocumentObject);
    const fieldsWithNewAuthorizationDirective = object.fields?.map((field) =>
        changeSubscriptionsAuthorizationDirectiveOnField(field, userDocumentObject)
    );
    const newDirectiveDirective =
        userAuthorizationDirective &&
        getSubscriptionsAuthorizationDirective(userAuthorizationDirective, object.name.value);
    return {
        ...object,
        directives: newDirectiveDirective ? (object.directives ?? []).concat(newDirectiveDirective) : object.directives,
        fields: fieldsWithNewAuthorizationDirective,
    };
}

function findSubscriptionsAuthorizationDirectiveByTypeName(
    typeName: string,
    enricherContext: EnricherContext
): boolean {
    const userDocumentObject = enricherContext.userDefinitionNodeMap[typeName] as
        | ObjectOrInterfaceDefinitionNode
        | undefined;
    const userDocumentExtensions = enricherContext.userDefinitionNodeMap[
        `${userDocumentObject?.name.value}_EXTENSIONS`
    ] as Array<ObjectOrInterfaceExtensionNode> | undefined;
    if (
        (userDocumentObject && containsSubscriptionsAuthorization(userDocumentObject)) ||
        (userDocumentExtensions && userDocumentExtensions.find(containsSubscriptionsAuthorization))
    ) {
        return true;
    }
    return false;
}

export function subscriptionsAuthorizationDefinitionsEnricher(enricherContext: EnricherContext): Enricher {
    return (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => {
        switch (definition.kind) {
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const hasAuthorization = findSubscriptionsAuthorizationDirectiveByTypeName(typeName, enricherContext);
                if (hasAuthorization) {
                    const authDefinitions = createSubscriptionsAuthorizationDefinitions(
                        typeName,
                        enricherContext.augmentedSchema
                    );
                    accumulatedDefinitions.push(...authDefinitions);
                }
            }
        }
        accumulatedDefinitions.push(definition);
        return accumulatedDefinitions;
    };
}

export function subscriptionsAuthorizationDirectiveEnricher(enricherContext: EnricherContext): Enricher {
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
                    let definitionWithEnrichedAuthorization = containsSubscriptionsAuthorization(userDocumentObject)
                        ? changeSubscriptionsAuthorizationDirectiveOnObject(definition, userDocumentObject)
                        : definition;
                    if (userDocumentExtensions) {
                        definitionWithEnrichedAuthorization = userDocumentExtensions.reduce((prev, curr) => {
                            return containsSubscriptionsAuthorization(curr)
                                ? changeSubscriptionsAuthorizationDirectiveOnObject(prev, curr)
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
