/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLID, Kind, type ASTVisitor, type FieldDefinitionNode, type TypeNode } from "graphql";
import { idDirective, relationshipPropertiesDirective } from "../../../../graphql/directives";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInRelationshipPropertiesType } from "../utils/location-helpers/is-in-relationship-properties-type";
import { getPathToNode } from "../utils/path-parser";

export function validateIdDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }

    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            if (!fieldDefinitionNode.directives?.find((directive) => directive.name.value === idDirective.name)) {
                return;
            }
            const isValidLocation =
                fieldIsInNodeType({ path, ancestors, typeMapWithExtensions }) ||
                fieldIsInRelationshipPropertiesType({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${idDirective.name}" must be in a type with "@node" or within the "@${relationshipPropertiesDirective.name}" directive`,
                        []
                    );
                }
                assertTypeIsSupportedByID(fieldDefinitionNode.type);
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${idDirective.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertTypeIsSupportedByID(type: TypeNode): void {
    if (type.kind === Kind.LIST_TYPE) {
        throw new DocumentValidationError("Cannot autogenerate an array.", ["@id"]);
    }
    if (type.kind === Kind.NON_NULL_TYPE) {
        return assertTypeIsSupportedByID(type.type);
    }
    if (GraphQLID.name !== type.name.value) {
        throw new DocumentValidationError("Cannot autogenerate a non ID field.", ["@id"]);
    }
}
