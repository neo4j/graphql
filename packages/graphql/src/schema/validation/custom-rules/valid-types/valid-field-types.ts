/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, DirectiveNode, FieldDefinitionNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { SCALAR_TYPES } from "../../../../constants";
import type { ValidationFunction } from "../utils/document-validation-error";
import { DocumentValidationError, assertValid, createGraphQLError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getPathToNode } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";

function verifyRelationshipFieldType({
    traversedDef,
}: {
    traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode;
}): void {
    if (traversedDef.kind !== Kind.FIELD_DEFINITION) {
        // delegate
        return;
    }
    const fieldTypeName = getInnerTypeName(traversedDef.type);
    if (SCALAR_TYPES.includes(fieldTypeName)) {
        const scalarTypesNotPermittedErrorMessage = `Invalid field type: Scalar types cannot be relationship targets. Please use an Object type instead.`;
        throw new DocumentValidationError(scalarTypesNotPermittedErrorMessage, []);
    }
    const listTypesErrorMessage = `Invalid field type: List type relationship fields must be non-nullable and have non-nullable entries, please change type to [${fieldTypeName}!]!`;

    const listIsNotNonNullable = traversedDef.type.kind === Kind.LIST_TYPE;
    if (listIsNotNonNullable) {
        throw new DocumentValidationError(listTypesErrorMessage, []);
    }

    if (traversedDef.type.kind === Kind.NON_NULL_TYPE) {
        const ifListThenHasNonNullableEntries =
            traversedDef.type.type.kind === Kind.LIST_TYPE
                ? traversedDef.type.type.type.kind === Kind.NON_NULL_TYPE
                : true;
        if (!ifListThenHasNonNullableEntries) {
            throw new DocumentValidationError(listTypesErrorMessage, []);
        }
    }
}

function getValidationFunction(directiveName: string): ValidationFunction | undefined {
    switch (directiveName) {
        case "relationship":
            return verifyRelationshipFieldType;
        case "declareRelationship":
            return verifyRelationshipFieldType;
        default:
            return;
    }
}

export function ValidFieldTypes(context: SDLValidationContext): ASTVisitor {
    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            const validationFn = getValidationFunction(directiveNode.name.value);
            if (!validationFn) {
                return;
            }
            if (!traversedDef) {
                console.error("No last definition traversed");
                return;
            }
            const { isValid, errorMsg, errorPath } = assertValid(() =>
                validationFn({
                    directiveNode,
                    traversedDef,
                    parentDef: parentOfTraversedDef,
                })
            );
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [traversedDef],
                        path: [...pathToNode, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}
