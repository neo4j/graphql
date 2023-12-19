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

import type {
    ASTVisitor,
    DirectiveNode,
    FieldDefinitionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { RESERVED_INTERFACE_FIELDS } from "../../../../constants";
import { DocumentValidationError, assertValid, createGraphQLError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getPathToNode } from "../utils/path-parser";

export function ValidRelationshipProperties(context: SDLValidationContext): ASTVisitor {
    const relationshipPropertyTypeNames = new Set<string>();
    const doOnObject = {
        leave(node: ObjectTypeDefinitionNode | ObjectTypeExtensionNode, _key, _parent, path, ancestors) {
            if (relationshipPropertyTypeNames.has(node.name.value)) {
                const { isValid, errorMsg, errorPath } = assertValid(() => assertRelationshipProperties(node));
                const [pathToNode] = getPathToNode(path, ancestors);
                if (!isValid) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [node],
                            path: [...pathToNode, node.name.value, ...errorPath],
                            errorMsg,
                        })
                    );
                }
            }
        },
    };
    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const [pathToNode, traversedDef] = getPathToNode(path, ancestors);
            if (!traversedDef) {
                console.error("No last definition traversed");
                return;
            }

            if (directiveNode.name.value === "relationshipProperties") {
                const { isValid, errorMsg, errorPath } = assertValid(() => assertRelationshipProperties(traversedDef));
                if (!isValid) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [directiveNode, traversedDef],
                            path: [...pathToNode, ...errorPath],
                            errorMsg,
                        })
                    );
                } else {
                    // to check on extensions
                    relationshipPropertyTypeNames.add(traversedDef?.name.value);
                }
            }
        },
        ObjectTypeDefinition: doOnObject,
        ObjectTypeExtension: doOnObject,
    };
}

function assertRelationshipProperties(traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode) {
    if (traversedDef.kind !== Kind.OBJECT_TYPE_DEFINITION && traversedDef.kind !== Kind.OBJECT_TYPE_EXTENSION) {
        // delegate
        return;
    }
    traversedDef.fields?.forEach((field) => {
        const errorPath = [field.name.value];
        RESERVED_INTERFACE_FIELDS.forEach(([fieldName, message]) => {
            if (field.name.value === fieldName) {
                throw new DocumentValidationError(`Invalid @relationshipProperties field: ${message}`, errorPath);
            }
        });

        if (field.directives) {
            const forbiddenDirectives = [
                "authorization",
                "authentication",
                "subscriptionsAuthorization",
                "relationship",
                "cypher",
            ];
            const foundForbiddenDirective = field.directives.find((d) => forbiddenDirectives.includes(d.name.value));
            if (foundForbiddenDirective) {
                throw new DocumentValidationError(
                    `Invalid @relationshipProperties field: Cannot use the @${foundForbiddenDirective.name.value} directive on relationship properties.`,
                    errorPath
                );
            }
        }
    });
}
