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
    ASTNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
} from "graphql";
import { Kind, GraphQLError } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { assertValid, DocumentValidationError } from "../utils/document-validation-error";

export function ValidObjectType() {
    return function (context: SDLValidationContext): ASTVisitor {
        return {
            ObjectTypeDefinition(objectType: ObjectTypeDefinitionNode) {
                const { isValid, errorMsg } = assertValid([assertValidType.bind(null, objectType)]);
                if (!isValid) {
                    const errorOpts = {
                        nodes: [objectType],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
                        path: undefined,
                        source: undefined,
                        positions: undefined,
                        originalError: undefined,
                    };

                    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                    context.reportError(
                        new GraphQLError(
                            errorMsg || "Error",
                            errorOpts.nodes,
                            errorOpts.source,
                            errorOpts.positions,
                            errorOpts.path,
                            errorOpts.originalError
                            // errorOpts.extensions
                        )
                    );
                }
            },
            InterfaceTypeDefinition(interfaceType: InterfaceTypeDefinitionNode) {
                const { isValid, errorMsg } = assertValid([assertValidType.bind(null, interfaceType)]);

                if (!isValid) {
                    const errorOpts = {
                        nodes: [interfaceType],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
                        path: undefined,
                        source: undefined,
                        positions: undefined,
                        originalError: undefined,
                    };

                    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                    context.reportError(
                        new GraphQLError(
                            errorMsg || "Error",
                            errorOpts.nodes,
                            errorOpts.source,
                            errorOpts.positions,
                            errorOpts.path,
                            errorOpts.originalError
                            // errorOpts.extensions
                        )
                    );
                }
            },
        };
    };
}

function assertValidType(type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode) {
    if (!type.fields || !type.fields.length) {
        throw new DocumentValidationError("Objects and Interfaces must have one or more fields.", []);
    }
}
