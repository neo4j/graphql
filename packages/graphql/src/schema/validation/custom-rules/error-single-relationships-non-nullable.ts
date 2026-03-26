/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, FieldDefinitionNode, ListTypeNode, NonNullTypeNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { relationshipDirective } from "../../../graphql/directives";
import { createGraphQLError } from "./utils/document-validation-error";
import { getPathToNode } from "./utils/path-parser";

export function ErrorIfSingleRelationshipNonNullable(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(field: FieldDefinitionNode, _key, _parent, path, ancestors) {
            let isRelationship = false;
            for (const directive of field.directives ?? []) {
                if (directive.name.value === relationshipDirective.name) {
                    isRelationship = true;
                }
            }

            if (!isRelationship) {
                return;
            }
            const isList = Boolean(getListTypeNode(field));
            const isNonNull = isNonNullTypeNode(field);
            if (!isList && isNonNull) {
                context.reportError(
                    createGraphQLError({
                        path: getPathToNode(path, ancestors)[0],
                        errorMsg: `Non-list relationship property "${field.name.value}" cannot have non-nullable type.`,
                    })
                );
            }
        },
    };
}

function getListTypeNode(definition: FieldDefinitionNode | ListTypeNode | NonNullTypeNode): ListTypeNode | undefined {
    if (definition.type.kind === Kind.NON_NULL_TYPE) {
        return getListTypeNode(definition.type);
    }

    if (definition.type.kind === Kind.LIST_TYPE) {
        return definition.type;
    }

    return;
}

function isNonNullTypeNode(definition: FieldDefinitionNode | ListTypeNode | NonNullTypeNode): boolean {
    if (definition.type.kind === Kind.NON_NULL_TYPE) {
        return true;
    }
    return false;
}
