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
import { getInnerTypeName } from "./directive-argument-value-is-valid";
const SCALAR_TYPE_NAMES = ["string", "int", "float", "boolean", "id"];

export function ValidJwtDirectives() {
    return function (context: SDLValidationContext): ASTVisitor {
        let seenJwtType = false;
        return {
            ObjectTypeDefinition(objectType: ObjectTypeDefinitionNode, _key, _parent, path, ancestors) {
                const [temp] = getPathToDirectiveNode(path, ancestors);
                const pathToHere = [...temp, objectType.name.value, `@jwt`];

                if (!objectType.directives) {
                    return;
                }

                const { isValid, errorMsg, ...extra } = assertJwtDirective(
                    objectType.directives,
                    objectType,
                    seenJwtType
                );
                seenJwtType = extra.seenJwtType;
                if (!isValid) {
                    const errorOpts = {
                        nodes: [objectType],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
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
                            // errorOpts.extensions
                        )
                    );
                }
            },

            FieldDefinition(field: FieldDefinitionNode, _key, _parent, path, ancestors) {
                const [temp, _, parentOfTraversedDef] = getPathToDirectiveNode(path, ancestors);
                const pathToHere = [...temp, `@jwtClaim`];

                if (!field.directives) {
                    return;
                }

                const { isValid, errorMsg } = assertJwtClaimDirective(
                    field.directives,
                    parentOfTraversedDef as ObjectTypeDefinitionNode
                );
                if (!isValid) {
                    const errorOpts = {
                        nodes: parentOfTraversedDef ? [parentOfTraversedDef, field] : [field],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
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
                            // errorOpts.extensions
                        )
                    );
                }
            },
        };
    };
}

function getPathToDirectiveNode(
    path: readonly (number | string)[],
    ancenstors: readonly (ASTNode | readonly ASTNode[])[]
): [
    Array<string>,
    ObjectTypeDefinitionNode | FieldDefinitionNode | InterfaceTypeDefinitionNode | undefined,
    ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | undefined
] {
    const documentASTNodes = ancenstors[1];
    if (!documentASTNodes || (Array.isArray(documentASTNodes) && !documentASTNodes.length)) {
        return [[], undefined, undefined];
    }
    const [, definitionIdx] = path;
    const traversedDefinition = documentASTNodes[definitionIdx as number];
    const pathToHere: (ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode)[] = [
        traversedDefinition,
    ];
    let lastSeenDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode =
        traversedDefinition;
    const getNextDefinition = parsePath(path, traversedDefinition);
    for (const definition of getNextDefinition()) {
        lastSeenDefinition = definition;
        pathToHere.push(definition);
    }
    const parentOfLastSeenDefinition = pathToHere.slice(-2)[0] as
        | ObjectTypeDefinitionNode
        | InterfaceTypeDefinitionNode;
    return [pathToHere.map((n) => n.name?.value || "Schema"), lastSeenDefinition, parentOfLastSeenDefinition];
}

function parsePath(
    path: readonly (number | string)[],
    traversedDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode
) {
    return function* getNextDefinition(idx = 2) {
        while (path[idx] && path[idx] !== "directives") {
            // continue parsing for annotated fields
            const key = path[idx] as string;
            const idxAtKey = path[idx + 1] as number;
            traversedDefinition = traversedDefinition[key][idxAtKey];
            yield traversedDefinition;
            idx += 2;
        }
    };
}

type AssertionResponse = {
    isValid: boolean;
    errorMsg?: string;
    errorPath: ReadonlyArray<string | number>;
};

function notCombined(directive: DirectiveNode) {
    if (["jwt", "jwtClaim"].includes(directive.name.value)) {
        throw new Error(
            `Invalid directive usage: Directive @${directive.name.value} cannot be used in combination with other directives.`
        );
    }
}

function correctClaimLocation(directive: DirectiveNode, objectType: ObjectTypeDefinitionNode) {
    if ("jwtClaim" === directive.name.value) {
        if (!objectType.directives?.find((d) => d.name.value === "jwt")) {
            throw new Error(
                `Invalid directive usage: Directive @${directive.name.value} can only be used in \\"@jwt\\" types.`
            );
        }
    }
}

function correctClaimFieldType(directive: DirectiveNode, objectType: ObjectTypeDefinitionNode) {
    if ("jwt" === directive.name.value) {
        // TODO: replace with schema model scalars
        if (
            objectType.fields?.some((field) => !SCALAR_TYPE_NAMES.includes(getInnerTypeName(field.type).toLowerCase()))
        ) {
            throw new Error(
                `Invalid directive usage: Fields of a @${directive.name.value} type can only be Scalars or Lists of Scalars.`
            );
        }
    }
}

function singleUse(directive: DirectiveNode, seenJwtType: boolean): boolean {
    if ("jwt" === directive.name.value) {
        if (seenJwtType) {
            throw new Error(
                `Invalid directive usage: Directive @${directive.name.value} can only be used once in the Type Definitions.`
            );
        } else {
            seenJwtType = true;
        }
    }
    return seenJwtType;
}

function assertJwtDirective(
    directives: readonly DirectiveNode[],
    objectType: ObjectTypeDefinitionNode,
    seenJwtType: boolean
): AssertionResponse & { seenJwtType: boolean } {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };

    try {
        directives.forEach((directive) => {
            if (directives.length > 1) {
                notCombined(directive);
            }
            seenJwtType = singleUse(directive, seenJwtType);
            correctClaimFieldType(directive, objectType);
        });
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath, seenJwtType };
}

function assertJwtClaimDirective(
    directives: readonly DirectiveNode[],
    objectType: ObjectTypeDefinitionNode
): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };

    try {
        directives.forEach((directive) => {
            if (directives.length > 1) {
                notCombined(directive);
            }
            correctClaimLocation(directive, objectType);
        });
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath };
}
