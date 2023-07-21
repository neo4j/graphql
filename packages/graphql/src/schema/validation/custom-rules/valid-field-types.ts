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
    ListTypeNode,
    TypeNode,
    NonNullTypeNode,
} from "graphql";
import { Kind, GraphQLError } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { getInnerTypeName } from "./directive-argument-value-is-valid";

export function ValidFieldTypes() {
    return function (context: SDLValidationContext): ASTVisitor {
        return {
            FieldDefinition(field: FieldDefinitionNode, _key, _parent, path, ancestors) {
                const [temp] = getPathToDirectiveNode(path, ancestors);

                const { isValid, errorMsg } = assertFieldOfValidType(field);
                if (!isValid) {
                    const errorOpts = {
                        nodes: [field],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
                        path: temp,
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

function assertFieldOfValidType(field: FieldDefinitionNode): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };

    try {
        isNotMatrixType(field);
        isValidRelationshipType(field);
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath };
}

function isNotMatrixType(field: FieldDefinitionNode) {
    const isListType = field.type.kind === Kind.LIST_TYPE;
    if (isListType) {
        const listNode = field.type;
        const isMatrix = listNode.type.kind === Kind.LIST_TYPE;
        // && listNode.type.type.kind === Kind.LIST_TYPE;
        if (isMatrix) {
            throw new Error(`Invalid field type: Matrix arrays not supported.`);
        }
    }
}

function isValidRelationshipType(field: FieldDefinitionNode) {
    if (field.directives?.find((d) => d.name.value === "relationship")) {
        const msg = `Invalid field type: List type relationship fields must be non-nullable and have non-nullable entries, please change type to [${getInnerTypeName(
            field.type
        )}!]!`;

        if (field.type.kind === Kind.NON_NULL_TYPE) {
            if (field.type.type.kind === Kind.LIST_TYPE) {
                if (field.type.type.type.kind !== Kind.NON_NULL_TYPE) {
                    throw new Error(msg);
                }
            }
        } else if (field.type.kind === Kind.LIST_TYPE) {
            throw new Error(msg);
        }
    }
}
