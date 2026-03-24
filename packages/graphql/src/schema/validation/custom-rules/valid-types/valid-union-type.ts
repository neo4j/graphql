/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind, type ASTVisitor, type UnionTypeDefinitionNode } from "graphql";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";

export function ValidUnionType(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;

    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the validation context");
    }
    return {
        UnionTypeDefinition(unionType: UnionTypeDefinitionNode) {
            const { isValid, errorMsg } = assertValid(() => {
                let hasNodeTypes = false;
                let hasNonNodeTypes = false;
                for (const concreteType of unionType.types ?? []) {
                    const concreteTypeFileName = concreteType.name.value;
                    const type = typeMapWithExtensions[concreteTypeFileName];
                    if (!type) {
                        throw new Error(`Type ${concreteTypeFileName} not found in validation`);
                    }

                    if (type.definition && type.definition.kind === Kind.OBJECT_TYPE_DEFINITION) {
                        const isConcreteTypeANode = typeIsANodeType({
                            objectTypeDefinitionNode: type.definition,
                            typeMapWithExtensions,
                        });

                        if (isConcreteTypeANode) {
                            hasNodeTypes = true;
                        } else {
                            hasNonNodeTypes = true;
                        }
                    }
                }
                if (hasNodeTypes && hasNonNodeTypes) {
                    throw new DocumentValidationError(
                        "Union needs to be fully implemented by `@node` types or no type in the union have the `@node` directive.",
                        []
                    );
                }
            });
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [unionType],
                        errorMsg,
                    })
                );
            }
        },
    };
}
