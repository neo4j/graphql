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

import type { ASTVisitor, DirectiveNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { verifyId } from "../directives/id";
import { verifyRelationshipFieldType } from "../directives/relationship";
import { verifyTimestamp } from "../directives/timestamp";
import type { ValidationFunction } from "../utils/document-validation-error";
import { assertValid, createGraphQLError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";

function getValidationFunction(directiveName: string): ValidationFunction | undefined {
    switch (directiveName) {
        case "id":
            return verifyId;
        case "timestamp":
            return verifyTimestamp;
        case "relationship":
            return verifyRelationshipFieldType;
        default:
            return;
    }
}

export function ValidFieldTypes(context: SDLValidationContext): ASTVisitor {
    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            const validationFn = getValidationFunction(directiveNode.name.value);
            if (!validationFn) {
                return;
            }
            if (!traversedDef) {
                console.error("No last definition traversed");
                return;
            }
            const { isValid, errorMsg, errorPath } = assertValid(() =>
                validationFn({
                    directiveNode,
                    traversedDef,
                    parentDef: parentOfTraversedDef,
                })
            );
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [traversedDef],
                        path: [...pathToNode, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}
