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
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
} from "graphql";
import { Kind, GraphQLError } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { GRAPHQL_BUILTIN_SCALAR_TYPES } from "../../../../constants";
import { assertValid, DocumentValidationError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";

export function ValidJwtDirectives() {
    return function (context: SDLValidationContext): ASTVisitor {
        let seenJwtType = false;
        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
                const isJwtDirective = directiveNode.name.value === "jwt";
                const isJwtClaimDirective = directiveNode.name.value === "jwtClaim";
                if (!isJwtDirective && !isJwtClaimDirective) {
                    return;
                }

                const [temp, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
                if (!traversedDef) {
                    console.error("No last definition traversed");
                    return;
                }
                const pathToHere = [...temp, `@${directiveNode.name.value}`];

                let result;
                if (isJwtDirective) {
                    result = assertValid(assertJwtDirective.bind(null, traversedDef, seenJwtType));
                    seenJwtType = true;
                } else {
                    result = assertValid(assertJwtClaimDirective.bind(null, traversedDef, parentOfTraversedDef));
                }

                const { isValid, errorMsg } = result;

                if (!isValid) {
                    const errorOpts = {
                        nodes: [directiveNode, traversedDef],
                        path: pathToHere,
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
                        )
                    );
                }
            },
        };
    };
}

function assertJwtDirective(
    objectType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode,
    seenJwtType: boolean
) {
    if (objectType.kind !== Kind.OBJECT_TYPE_DEFINITION) {
        // delegate
        return;
    }

    if (seenJwtType) {
        throw new DocumentValidationError(
            `Invalid directive usage: Directive @jwt can only be used once in the Type Definitions.`,
            []
        );
    }

    if (objectType.directives && objectType.directives.length > 1) {
        throw new DocumentValidationError(
            `Invalid directive usage: Directive @jwt cannot be used in combination with other directives.`,
            []
        );
    }
    if (objectType.fields?.some((field) => !GRAPHQL_BUILTIN_SCALAR_TYPES.includes(getInnerTypeName(field.type)))) {
        throw new DocumentValidationError(
            `Invalid directive usage: Fields of a @jwt type can only be Scalars or Lists of Scalars.`,
            []
        );
    }
}

function assertJwtClaimDirective(
    fieldType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode,
    objectType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | undefined
) {
    if (!objectType) {
        console.error("No parent of last definition traversed");
        return;
    }

    if (fieldType.kind !== Kind.FIELD_DEFINITION || objectType.kind !== Kind.OBJECT_TYPE_DEFINITION) {
        // delegate
        return;
    }

    if (fieldType.directives && fieldType.directives.length > 1) {
        throw new DocumentValidationError(
            `Invalid directive usage: Directive @jwtClaim cannot be used in combination with other directives.`,
            []
        );
    }
    if (!objectType.directives?.find((d) => d.name.value === "jwt")) {
        throw new DocumentValidationError(
            `Invalid directive usage: Directive @jwtClaim can only be used in \\"@jwt\\" types.`,
            []
        );
    }
}
