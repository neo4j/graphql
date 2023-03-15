import { Kind } from "graphql";
import type {
    TypeDefinitionNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    DefinitionNode,
    ConstDirectiveNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { createAuthorizationDefinitions } from "../../../graphql/directives/dynamic-directives/authorization";

import type { EnricherContext } from "../EnricherContext";
import type { Enricher } from "./types";

function isAuthorizationDefinition(directive: ConstDirectiveNode): boolean {
    return directive.name.value === "authorization";
}

function containsAuthorization(object: TypeDefinitionNode | ObjectTypeExtensionNode): boolean {
    switch (object.kind) {
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

function getAuthorizationUsage(currentDirectiveUsage: ConstDirectiveNode, typeName: string): ConstDirectiveNode {
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
    userDocumentObject: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode
): FieldDefinitionNode {
    const userField = userDocumentObject.fields?.find(
        (userDefinitionField) => field.name.value === userDefinitionField.name.value
    );
    if (userField) {
        const userFieldAuthorizationUsage = userField.directives?.find(isAuthorizationDefinition) as ConstDirectiveNode;
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
    userDocumentObject: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode
): FieldDefinitionNode[] {
    return fields?.map((field) => {
        return changeAuthorizationUsageOnField(field, userDocumentObject);
    });
}

function changeAuthorizationUsageOnObject(
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode,
    userDocumentObject: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode
): ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode {
    const userAuthorizationUsage = userDocumentObject.directives?.find(isAuthorizationDefinition) as ConstDirectiveNode;
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
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const userDocumentObject = enricherContext.userDefinitionNodeMap[typeName] as
                    | ObjectTypeDefinitionNode
                    | undefined;
                const hasAuthorization = userDocumentObject ? containsAuthorization(userDocumentObject) : false;
                if (hasAuthorization) {
                    const authDefinitions = createAuthorizationDefinitions(typeName, enricherContext.augmentedSchema);
                    accumulatedDefinitions.push(...authDefinitions);
                }
                const userDocumentExtensions = enricherContext.userDefinitionNodeMap[`${typeName}_EXTENSIONS`] as
                    | ObjectTypeExtensionNode[]
                    | undefined;
                if (userDocumentExtensions) {
                    const extensionAuthorizations = userDocumentExtensions.filter((userDocumentExtension) =>
                        containsAuthorization(userDocumentExtension)
                    );
                    if (extensionAuthorizations.length > 1 || hasAuthorization) {
                        throw new Error(
                            `@authorization directive used in ambiguous way, Type ${typeName} has already @authorization applied`
                        );
                    }
                    if (extensionAuthorizations.length === 1) {
                        const authDefinitions = createAuthorizationDefinitions(
                            typeName,
                            enricherContext.augmentedSchema
                        );
                        accumulatedDefinitions.push(...authDefinitions);
                    }
                }
                break;
            }
            case Kind.INTERFACE_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const userDocumentInterface = enricherContext.userDefinitionNodeMap[typeName] as
                    | InterfaceTypeDefinitionNode
                    | undefined;
                const hasAuthorization = userDocumentInterface ? containsAuthorization(userDocumentInterface) : false;
                if (hasAuthorization) {
                    const authDefinitions = createAuthorizationDefinitions(typeName, enricherContext.augmentedSchema);
                    accumulatedDefinitions.push(...authDefinitions);
                }
                break;
            }
        }
        accumulatedDefinitions.push(definition);
        return accumulatedDefinitions;
    };
}

export function authorizationUsageEnricher(enricherContext: EnricherContext): Enricher {
    return (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => {
        switch (definition.kind) {
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const userDocumentObject = enricherContext.userDefinitionNodeMap[typeName] as
                    | ObjectTypeDefinitionNode
                    | undefined;
                const userDocumentExtensions = enricherContext.userDefinitionNodeMap[`${typeName}_EXTENSIONS`] as
                    | ObjectTypeExtensionNode[]
                    | undefined;
                if (userDocumentObject) {
                    if (containsAuthorization(userDocumentObject)) {
                        const newDefinition = changeAuthorizationUsageOnObject(definition, userDocumentObject);
                        accumulatedDefinitions.push(newDefinition);
                        return accumulatedDefinitions;
                    }
                }
                const extensionWithAuthorization =
                    userDocumentExtensions &&
                    userDocumentExtensions.find((userDocumentExtension) =>
                        containsAuthorization(userDocumentExtension)
                    );
                if (extensionWithAuthorization) {
                    const newDefinition = changeAuthorizationUsageOnObject(definition, extensionWithAuthorization);
                    accumulatedDefinitions.push(newDefinition);
                    return accumulatedDefinitions;
                }

                accumulatedDefinitions.push(definition);
                return accumulatedDefinitions;
            }
            case Kind.INTERFACE_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const userDocumentInterface = enricherContext.userDefinitionNodeMap[
                    typeName
                ] as InterfaceTypeDefinitionNode;
                const newDefinition =
                    userDocumentInterface && containsAuthorization(userDocumentInterface)
                        ? changeAuthorizationUsageOnObject(definition, userDocumentInterface)
                        : definition;
                accumulatedDefinitions.push(newDefinition);
                return accumulatedDefinitions;
            }
            default:
                accumulatedDefinitions.push(definition);
                return accumulatedDefinitions;
        }
    };
}
