/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { type ASTVisitor, type InterfaceTypeDefinitionNode, type ObjectTypeDefinitionNode } from "graphql";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { DocumentValidationError, assertValid, createGraphQLError } from "../utils/document-validation-error";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";

export function ValidObjectType(context: Neo4jValidationContext): ASTVisitor {
    const interfaceMap = context.interfacesMap;
    const typeMapWithExtensions = context.typeMapWithExtensions;

    if (!interfaceMap || !typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the validation context");
    }
    return {
        ObjectTypeDefinition(objectType: ObjectTypeDefinitionNode) {
            const { isValid, errorMsg } = assertValid(() => assertValidType(objectType));
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectType],
                        errorMsg,
                    })
                );
            }
        },
        InterfaceTypeDefinition(interfaceType: InterfaceTypeDefinitionNode) {
            const { isValid, errorMsg } = assertValid(() => {
                assertValidType(interfaceType);
                assertValidNodeInterface(interfaceType, context);
            });

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [interfaceType],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertValidType(type: ObjectOrInterfaceWithExtensions) {
    if (!type.fields || !type.fields.length) {
        throw new DocumentValidationError("Objects and Interfaces must have one or more fields.", []);
    }
    const privateFieldsCount = type.fields.filter((f) => f.directives?.find((d) => d.name.value === "private")).length;
    const fieldsCount = type.fields.length;
    if (privateFieldsCount === fieldsCount) {
        throw new DocumentValidationError("Objects and Interfaces must have one or more fields.", []);
    }
}

function assertValidNodeInterface(interfaceType: InterfaceTypeDefinitionNode, context: Neo4jValidationContext) {
    const interfaceMap = context.interfacesMap;
    const typeMapWithExtensions = context.typeMapWithExtensions;

    if (!interfaceMap || !typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the validation context");
    }
    const interfaceName = interfaceType.name.value;
    const interfaceConcreteTypes = interfaceMap[interfaceName] ?? [];

    let isNodeInterface = false;
    let hasNonNodeTypes = false;
    for (const concreteType of interfaceConcreteTypes) {
        const isConcreteTypeANode = typeIsANodeType({
            objectTypeDefinitionNode: concreteType,
            typeMapWithExtensions,
        });

        if (isConcreteTypeANode) {
            isNodeInterface = true;
        } else {
            hasNonNodeTypes = true;
        }
    }
    if (isNodeInterface && hasNonNodeTypes) {
        throw new DocumentValidationError("Interface needs to be fully implemented by `@node` types.", []);
    }
}
