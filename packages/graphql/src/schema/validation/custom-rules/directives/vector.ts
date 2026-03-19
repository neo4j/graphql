/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, ObjectTypeDefinitionNode } from "graphql";
import { vectorDirective } from "../../../../graphql/directives/vector";
import { asArray } from "../../../../utils/utils";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";
import { getPathToNode } from "../utils/path-parser";

export function validateVectorDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, path, ancestors) {
            const { directives } = objectTypeDefinitionNode;
            const objectTypeExtensionNodes = typeMapWithExtensions[objectTypeDefinitionNode.name.value]?.extensions;
            const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
                return extensionNode.directives ?? [];
            });
            const allDirectives = [...(directives ?? []), ...extensionsDirectives];
            const vectorDirectiveOnNode = allDirectives.find(
                (directive) => directive.name.value === vectorDirective.name
            );
            if (!vectorDirectiveOnNode) {
                return;
            }
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, typeMapWithExtensions });
            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "@${vectorDirective.name}" must be in a type with "@node"`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToNode[0], objectTypeDefinitionNode.name.value],
                        errorMsg,
                    })
                );
            }
        },
    };
}
