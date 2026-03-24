/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTNode, ASTVisitor, FieldDefinitionNode } from "graphql";
import { GRAPHQL_BUILTIN_SCALAR_TYPES } from "../../../../constants";
import { groupByDirective } from "../../../../graphql/directives";
import type { Neo4jValidationContext, TypeMapWithExtensions } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsList } from "../utils/location-helpers/field-is-list";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInSubscriptionType } from "../utils/location-helpers/is-in-subscription-type";
import { getPathToNode } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";

export function validateGroupByDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            if (
                !fieldDefinitionNode.directives?.length ||
                !fieldDefinitionNode.directives.find((directive) => directive.name.value === groupByDirective.name)
            ) {
                return;
            }

            const isValidLocation = isGroupByLocationValid({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Invalid directive usage: Directive "@${groupByDirective.name}" should be in a type with "@node"`,
                        []
                    );
                }

                if (fieldIsList(fieldDefinitionNode.type)) {
                    throw new DocumentValidationError(
                        `Invalid directive usage: Directive "@${groupByDirective.name}" cannot be applied to lists`,
                        []
                    );
                }

                const fieldType = getInnerTypeName(fieldDefinitionNode.type);
                if (!GRAPHQL_BUILTIN_SCALAR_TYPES.includes(fieldType)) {
                    throw new DocumentValidationError(
                        `Invalid directive usage: Directive "@${groupByDirective.name}" can only be applied to primitive fields`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${groupByDirective.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function isGroupByLocationValid(directiveLocationData: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    if (fieldIsInSubscriptionType(directiveLocationData)) {
        return false;
    }

    return fieldIsInNodeType(directiveLocationData);
    // || fieldIsInRelationshipPropertiesType(directiveLocationData)
}
