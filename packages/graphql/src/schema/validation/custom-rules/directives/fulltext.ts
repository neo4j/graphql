/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { ASTVisitor, FieldDefinitionNode, ObjectTypeDefinitionNode, TypeNode } from "graphql";
import { GraphQLID, GraphQLString, Kind } from "graphql";
import { fulltextDirective } from "../../../../graphql/directives";
import type { FulltextField } from "../../../../schema-model/annotation/FulltextAnnotation";
import { parseValueNode } from "../../../../schema-model/parser/parse-value-node";
import { asArray } from "../../../../utils/utils";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";

export function validateFulltextDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, _path, _ancestors) {
            const { directives } = objectTypeDefinitionNode;
            const objectTypeExtensionNodes = typeMapWithExtensions[objectTypeDefinitionNode.name.value]?.extensions;
            const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
                return extensionNode.directives ?? [];
            });
            const allDirectives = [...(directives ?? []), ...extensionsDirectives];
            const appliedFulltextDirective = allDirectives.find(
                (directive) => directive.name.value === fulltextDirective.name
            );
            if (!appliedFulltextDirective) {
                return;
            }
            const indexesArg = appliedFulltextDirective.arguments?.find((a) => a.name.value === "indexes");
            if (!indexesArg) {
                // delegate to DirectiveArgumentOfCorrectType rule
                return;
            }

            const compatibleFields = getFulltextCompatibleFields(objectTypeDefinitionNode);
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, typeMapWithExtensions });
            const { isValid, errorMsg, errorPath } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${fulltextDirective.name}" must be in a type with "@node"`,
                        []
                    );
                }
                const indexesValues = parseValueNode(indexesArg.value) as FulltextField[];

                indexesValues.forEach((indexValue) => {
                    const indexName = indexValue.indexName;
                    const indexNames = indexesValues.filter((i) => indexName === i.indexName);
                    if (indexNames.length > 1) {
                        throw new DocumentValidationError(
                            `@${fulltextDirective.name}.indexes invalid value for: ${indexName}. Duplicate index name.`,
                            ["indexes"]
                        );
                    }

                    const queryName = indexValue.queryName;
                    const queryNames = indexesValues.filter((i) => queryName === i.queryName);
                    if (queryNames.length > 1) {
                        throw new DocumentValidationError(
                            `@${fulltextDirective.name}.indexes invalid value for: ${queryName}. Duplicate query name.`,
                            ["indexes"]
                        );
                    }
                    asArray(indexValue.fields).forEach((indexField) => {
                        if (!compatibleFields[indexField]) {
                            throw new DocumentValidationError(
                                `@${fulltextDirective.name}.indexes invalid value for: ${indexValue.indexName}. Field ${indexField} is not of type String or ID.`,
                                ["indexes"]
                            );
                        }
                    });
                });
            });
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [objectTypeDefinitionNode.name.value, `@${fulltextDirective.name}`, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function getFulltextCompatibleFields(
    objectTypeDefinitionNode: ObjectTypeDefinitionNode
): Record<string, FieldDefinitionNode> {
    return (objectTypeDefinitionNode.fields ?? []).reduce(
        (acc, f): Record<string, FieldDefinitionNode> => {
            if (isFieldFullTextCompatible(f.type)) {
                acc[f.name.value] = f;
            }
            return acc;
        },
        {} as Record<string, FieldDefinitionNode>
    );
}

function isFieldFullTextCompatible(fieldType: TypeNode): boolean {
    if (fieldType.kind === Kind.NAMED_TYPE) {
        return [GraphQLString.name, GraphQLID.name].includes(fieldType.name.value);
    }
    if (fieldType.kind === Kind.NON_NULL_TYPE) {
        return isFieldFullTextCompatible(fieldType.type);
    }
    return false;
}
