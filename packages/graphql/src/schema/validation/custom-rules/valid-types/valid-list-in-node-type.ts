/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind, type ASTVisitor, type ObjectTypeDefinitionNode, type TypeNode } from "graphql";

import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import {
    cypherDirective,
    nodeDirective,
    relationshipDirective,
    relationshipPropertiesDirective,
} from "../../../../graphql/directives";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { getInnerTypeName, getPrettyName } from "../utils/utils";

/**
 * Validates that list types used in type annotated with the node directive are supported by Neo4j
 **/
export function ValidListInNodeType(context: SDLValidationContext): ASTVisitor {
    return {
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent) {
            const { directives } = objectTypeDefinitionNode;

            const nodeUsage = directives?.find((directive) => directive.name.value === nodeDirective.name);
            const relationshipPropertiesUsage = directives?.find(
                (directive) => directive.name.value === relationshipPropertiesDirective.name
            );
            if (!directives) {
                return; // Skip when no directives are present
            }

            if (!nodeUsage && !relationshipPropertiesUsage) {
                return; // Skip if is the type is neither annotated with node nor relationshipProperties
            }

            objectTypeDefinitionNode.fields?.forEach((fieldDefinitionNode) => {
                const { type, directives } = fieldDefinitionNode;
                if (
                    directives &&
                    directives.some(
                        (directive) =>
                            directive.name.value === cypherDirective.name ||
                            directive.name.value === relationshipDirective.name
                    )
                ) {
                    return; // Skip cypher fields and relationship fields, relationship fields have their own validation
                }
                const { isValid, errorMsg, errorPath } = assertValid(() => {
                    const typePath = getTypePath(type);
                    if (typePath.includes(Kind.LIST_TYPE)) {
                        const wrappedType = getInnerTypeName(type);
                        const validTypePaths: string[][] = [
                            [Kind.LIST_TYPE, Kind.NON_NULL_TYPE, wrappedType],
                            [Kind.NON_NULL_TYPE, Kind.LIST_TYPE, Kind.NON_NULL_TYPE, wrappedType],
                        ];
                        if (!findTypePathInTypePaths(typePath, validTypePaths)) {
                            const typeStr = getPrettyName(type);

                            const directiveName = (nodeUsage ?? relationshipPropertiesUsage)?.name?.value;
                            throw new DocumentValidationError(
                                `List of nullable elements are not supported in "@${directiveName}" types. Found: ${typeStr}`,
                                []
                            );
                        }
                    }
                });

                if (!isValid) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [fieldDefinitionNode],
                            path: [objectTypeDefinitionNode.name.value, fieldDefinitionNode.name.value, ...errorPath],
                            errorMsg,
                        })
                    );
                }
            });
        },
    };
}

function getTypePath(typeNode: TypeNode, currentPath: string[] = []): string[] {
    if (typeNode.kind === Kind.NON_NULL_TYPE || typeNode.kind === Kind.LIST_TYPE) {
        return getTypePath(typeNode.type, [...currentPath, typeNode.kind]);
    }
    return [...currentPath, typeNode.name.value];
}

function findTypePathInTypePaths(typePathToFind: string[], typePaths: string[][]): boolean {
    const typePathString = typePathToFind.join();
    return typePaths.some((typePath) => typePathString === typePath.join());
}
