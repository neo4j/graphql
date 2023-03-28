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

type PossibleAuthorizationLocation =
    | ObjectTypeDefinitionNode
    | InterfaceTypeDefinitionNode
    | ObjectTypeExtensionNode
    | InterfaceTypeExtensionNode;

function isAuthorizationDefinition(directive: any): boolean {
    return directive.name.value === "authorization";
}

function containsAuthorization(object: PossibleAuthorizationLocation): boolean {
    switch (object.kind) {
        case Kind.INTERFACE_TYPE_EXTENSION:
        case Kind.OBJECT_TYPE_EXTENSION:
        case Kind.INTERFACE_TYPE_DEFINITION:
        case Kind.OBJECT_TYPE_DEFINITION: {
            const hasFields = !!object.fields;
            return (
                object.directives?.some(isAuthorizationDefinition) ||
                (hasFields && object.fields.some((field) => field.directives?.some(isAuthorizationDefinition)))
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
    userDocumentObject: PossibleAuthorizationLocation
): FieldDefinitionNode {
    const userField = userDocumentObject.fields?.find(
        (userDefinitionField) => field.name.value === userDefinitionField.name.value
    );
    if (userField) {
        const userFieldAuthorizationUsage = userField.directives?.find(isAuthorizationDefinition);
        if (userFieldAuthorizationUsage) {
            const fieldAuthorizationUsage = getAuthorizationUsage(
                userFieldAuthorizationUsage,
                userDocumentObject.name.value
            );
            return { ...field, directives: [...(field?.directives ?? []), fieldAuthorizationUsage] };
        }
    }
    return field;
}

function changeAuthorizationUsageOnFields(
    fields: readonly FieldDefinitionNode[],
    userDocumentObject: PossibleAuthorizationLocation
): FieldDefinitionNode[] {
    return fields?.map((field) => {
        return changeAuthorizationUsageOnField(field, userDocumentObject);
    });
}

function changeAuthorizationUsageOnObject(
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    userDocumentObject: PossibleAuthorizationLocation
): ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode {
    const userAuthorizationUsage = userDocumentObject.directives?.find(isAuthorizationDefinition);
    const fieldsWithNewAuthorizationUsage =
        object.fields && changeAuthorizationUsageOnFields(object.fields, userDocumentObject);
    const newDirectiveUsage =
        userAuthorizationUsage && getAuthorizationUsage(userAuthorizationUsage, object.name.value);
    return {
        ...object,
        directives: newDirectiveUsage ? [...(object.directives ?? []), newDirectiveUsage] : object?.directives,
        fields: fieldsWithNewAuthorizationUsage,
    };
}

export function authorizationDefinitionsEnricher(enricherContext: EnricherContext): Enricher {
    return (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => {
        switch (definition.kind) {
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const userDocumentObject = enricherContext.userDefinitionNodeMap[typeName] as
                    | ObjectTypeDefinitionNode
                    | InterfaceTypeDefinitionNode
                    | undefined;
                const hasAuthorization = userDocumentObject ? containsAuthorization(userDocumentObject) : false;
                if (hasAuthorization) {
                    const authDefinitions = createAuthorizationDefinitions(typeName, enricherContext.augmentedSchema);
                    accumulatedDefinitions.push(...authDefinitions);
                }
                const userDocumentExtensions = enricherContext.userDefinitionNodeMap[`${typeName}_EXTENSIONS`] as
                    | Array<ObjectTypeExtensionNode | InterfaceTypeExtensionNode>
                    | undefined;
                if (!hasAuthorization && userDocumentExtensions) {
                    const extensionAuthorizations = userDocumentExtensions.filter((userDocumentExtension) =>
                        containsAuthorization(userDocumentExtension)
                    );
                    if (extensionAuthorizations.length >= 1) {
                        const authDefinitions = createAuthorizationDefinitions(
                            typeName,
                            enricherContext.augmentedSchema
                        );
                        accumulatedDefinitions.push(...authDefinitions);
                    }
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
                    | ObjectTypeDefinitionNode
                    | InterfaceTypeDefinitionNode
                    | undefined;

                const userDocumentExtensions = enricherContext.userDefinitionNodeMap[`${typeName}_EXTENSIONS`] as
                    | Array<ObjectTypeExtensionNode | InterfaceTypeExtensionNode>
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
