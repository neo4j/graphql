/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type {
    DefinitionNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { Kind } from "graphql";
import type { EnricherContext } from "../../EnricherContext";
import type { Enricher } from "../../types";
import type { DIRECTIVE_TRANSFORM_FN } from "./utils";
import { containsDirective, getDirectiveDefinition } from "./utils";

type ObjectOrInterfaceDefinitionNode = ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
type ObjectOrInterfaceExtensionNode = ObjectTypeExtensionNode | InterfaceTypeExtensionNode;
type ObjectLikeDefinitionNode = ObjectOrInterfaceDefinitionNode | ObjectOrInterfaceExtensionNode;

// Enriches the applied directives on objects, interfaces and fields
export function directiveEnricher(
    enricherContext: EnricherContext,
    directiveName: string,
    transformFn: DIRECTIVE_TRANSFORM_FN
): Enricher {
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
                    let definitionWithEnrichedDirective = containsDirective(userDocumentObject, directiveName)
                        ? changeDirectiveOnObject(definition, userDocumentObject, directiveName, transformFn)
                        : definition;
                    if (userDocumentExtensions) {
                        definitionWithEnrichedDirective = userDocumentExtensions.reduce((prev, curr) => {
                            return containsDirective(curr, directiveName)
                                ? changeDirectiveOnObject(prev, curr, directiveName, transformFn)
                                : prev;
                        }, definitionWithEnrichedDirective);
                    }
                    accumulatedDefinitions.push(definitionWithEnrichedDirective);
                    return accumulatedDefinitions;
                }
            }
        }
        accumulatedDefinitions.push(definition);
        return accumulatedDefinitions;
    };
}

function changeDirectiveOnObject(
    object: ObjectOrInterfaceDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode,
    directiveName: string,
    transformFn: DIRECTIVE_TRANSFORM_FN
): ObjectOrInterfaceDefinitionNode {
    const userDirective = getDirectiveDefinition(userDocumentObject, directiveName);
    const fieldsWithNewDirective = object.fields?.map((field) =>
        changeDirectiveOnField(field, userDocumentObject, directiveName, transformFn)
    );
    const newDirectiveDirective = userDirective && transformFn(userDirective, object.name.value);
    return {
        ...object,
        directives: newDirectiveDirective ? (object.directives ?? []).concat(newDirectiveDirective) : object.directives,
        fields: fieldsWithNewDirective,
    };
}
function changeDirectiveOnField(
    field: FieldDefinitionNode,
    userDocumentObject: ObjectLikeDefinitionNode,
    directiveName: string,
    transformFn: DIRECTIVE_TRANSFORM_FN
): FieldDefinitionNode {
    const userField = userDocumentObject.fields?.find(
        (userDefinitionField) => field.name.value === userDefinitionField.name.value
    );
    const userFieldDirective = userField && getDirectiveDefinition(userField, directiveName);
    if (!userFieldDirective) {
        return field;
    }
    const fieldDirective = transformFn(userFieldDirective, userDocumentObject.name.value);
    return { ...field, directives: (field.directives ?? []).concat(fieldDirective) };
}
