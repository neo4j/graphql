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
