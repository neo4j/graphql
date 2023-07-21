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
import { RESERVED_INTERFACE_FIELDS } from "../../../constants";

export function ValidGlobalID() {
    return function (context: SDLValidationContext): ASTVisitor {
        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
                if (directiveNode.name.value !== "id") {
                    return;
                }

                const [temp, traversedDef] = getPathToDirectiveNode(path, ancestors);
                if (!traversedDef) {
                    console.error("No last definition traversed");
                    return;
                }

                const { isValid, errorMsg, errorPath } = assertValidGlobalID(
                    traversedDef as ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode
                );
                if (!isValid) {
                    const errorOpts = {
                        nodes: [directiveNode, traversedDef],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
                        path: [...temp, ...errorPath],
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

function assertValidGlobalID(
    // field: FieldDefinitionNode,
    type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode
): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };

    /*
            const globalIdFields = nodeFields.primitiveFields.filter((field) => field.isGlobalIdField);

        if (globalIdFields.length > 1) {
            throw new Error(
                "Only one field may be decorated with an '@id' directive with the global argument set to `true`"
            );
        }

        const globalIdField = globalIdFields[0];

        const idField = definition.fields?.find((x) => x.name.value === "id");

        if (globalIdField && idField) {
            const hasAlias = idField.directives?.find((x) => x.name.value === "alias");
            if (!hasAlias) {
                throw new Error(
                    `Type ${definition.name.value} already has a field "id." Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field`
                );
            }
        }

        if (globalIdField && !globalIdField.unique) {
            throw new Error(
                `Fields decorated with the "@id" directive must be unique in the database. Please remove it, or consider making the field unique`
            );
        }
    */
    try {
        const globalIdFields = type.fields?.filter((f) =>
            f.directives?.find(
                (d) =>
                    d.name.value === "id" &&
                    d.arguments?.find(
                        (a) => a.name.value === "global" && a.value.kind === Kind.BOOLEAN && a.value.value === true
                    )
            )
        );

        if (globalIdFields) {
            if (globalIdFields.length > 1) {
                throw new Error(
                    "Only one field may be decorated with an '@id' directive with the global argument set to `true`"
                );
            }

            const globalIdField = globalIdFields[0];

            const idField = type.fields?.find((x) => x.name.value === "id");

            if (globalIdField && idField) {
                const hasAlias = idField.directives?.find((x) => x.name.value === "alias");
                if (!hasAlias) {
                    throw new Error(
                        `Type ${type.name.value} already has a field "id." Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field`
                    );
                }
            }

            if (
                globalIdField &&
                !globalIdField.directives
                    ?.find((d) => d.name.value === "id")
                    ?.arguments?.find(
                        (a) => a.name.value === "unique" && a.value.kind === Kind.BOOLEAN && a.value.value === true
                    )
            ) {
                throw new Error(
                    `Fields decorated with the "@id" directive must be unique in the database. Please remove it, or consider making the field unique`
                );
            }
        }
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath };
}
