/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import { vectorDirective } from "../../../../graphql/directives/vector";
import type { VectorField } from "../../../../schema-model/annotation/VectorAnnotation";
import { parseValueNode } from "../../../../schema-model/parser/parse-value-node";
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
            const vectorDirectivesOnNode = allDirectives.filter(
                (directive) => directive.name.value === vectorDirective.name
            );
            if (!vectorDirectivesOnNode.length) {
                return;
            }
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, typeMapWithExtensions });
            const { isValid, errorMsg, errorPath } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "@${vectorDirective.name}" must be in a type with "@node"`,
                        []
                    );
                }
                for (const vectorDirectiveOnNode of vectorDirectivesOnNode) {
                    assertMaxPhraseLengthIsValid(vectorDirectiveOnNode);
                }
            });
            const pathToNode = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToNode[0], objectTypeDefinitionNode.name.value, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertMaxPhraseLengthIsValid(vectorDirectiveOnNode: DirectiveNode): void {
    const indexesArg = vectorDirectiveOnNode.arguments?.find((argument) => argument.name.value === "indexes");
    if (!indexesArg) {
        return;
    }
    const indexes = asArray(parseValueNode(indexesArg.value)) as VectorField[];
    for (const index of indexes) {
        const maxPhraseLength = index?.maxPhraseLength;
        if (maxPhraseLength == null) {
            continue;
        }
        if (maxPhraseLength < 1) {
            throw new DocumentValidationError(
                `@${vectorDirective.name}.indexes invalid value for maxPhraseLength: ${maxPhraseLength}. Must be at least 1.`,
                ["indexes"]
            );
        }
        // Mirrors augment/vector.ts: the `phrase` argument (and thus maxPhraseLength) only exists when provider or callback is set.
        // The @vector directive has no callback argument, so callback is not currently populatable from type defs; the check is kept for parity with augment/vector.ts.
        if (index.provider == null && index.callback == null) {
            throw new DocumentValidationError(
                `@${vectorDirective.name}.indexes maxPhraseLength can only be set on an index with a provider (used for query by phrase).`,
                ["indexes"]
            );
        }
    }
}
