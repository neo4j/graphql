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

export function ValidGlobalID() {
    return function (context: SDLValidationContext): ASTVisitor {
        const typeNameToGlobalId = new Map<string, boolean>();
        const interfaceToImplementingTypes = new Map<string, string[]>();
        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
                const [temp, traversedDef, parentOfTraversedDef] = getPathToDirectiveNode(path, ancestors);
                if (!traversedDef) {
                    console.error("No last definition traversed");
                    return;
                }
                if (!parentOfTraversedDef) {
                    console.error("No parent of last definition traversed");
                    return;
                }

                if (directiveNode.name.value !== "id") {
                    return;
                }
                const isGlobalID = directiveNode.arguments?.find(
                    (a) => a.name.value === "global" && a.value.kind === Kind.BOOLEAN && a.value.value === true
                );
                if (!isGlobalID) {
                    return;
                }

                const { isValid, errorMsg, errorPath } = assertValidGlobalID(
                    directiveNode,
                    parentOfTraversedDef,
                    typeNameToGlobalId,
                    interfaceToImplementingTypes
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

            ObjectTypeDefinition: {
                enter(objectType: ObjectTypeDefinitionNode) {
                    objectType.interfaces?.forEach((i) => {
                        const x = interfaceToImplementingTypes.get(i.name.value) || [];
                        interfaceToImplementingTypes.set(i.name.value, x?.concat(objectType.name.value));
                    });
                },
                leave(objectType: ObjectTypeDefinitionNode) {
                    const hasGlobalIDField = typeNameToGlobalId.get(objectType.name.value);
                    const fieldNamedID = objectType.fields?.find((x) => x.name.value === "id");

                    if (!hasGlobalIDField || !fieldNamedID) {
                        return;
                    }

                    const { isValid, errorMsg, errorPath } = assertGlobalIDDoesNotClash(objectType, fieldNamedID);
                    if (!isValid) {
                        const errorOpts = {
                            nodes: [objectType, fieldNamedID],
                            // extensions: {
                            //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                            // },
                            path: [objectType.name.value, ...errorPath],
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
            },

            InterfaceTypeDefinition: {
                leave(interfaceType: InterfaceTypeDefinitionNode) {
                    const hasGlobalIDField = typeNameToGlobalId.get(interfaceType.name.value);
                    const fieldNamedID = interfaceType.fields?.find((x) => x.name.value === "id");

                    if (!hasGlobalIDField || !fieldNamedID) {
                        return;
                    }

                    const { isValid, errorMsg, errorPath } = assertGlobalIDDoesNotClash(interfaceType, fieldNamedID);
                    if (!isValid) {
                        const errorOpts = {
                            nodes: [interfaceType],
                            // extensions: {
                            //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                            // },
                            path: [interfaceType.name.value, ...errorPath],
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

function assertGlobalIDDoesNotClash(
    objectType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    fieldNamedID: FieldDefinitionNode
): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };
    try {
        const hasAlias = fieldNamedID.directives?.find((x) => x.name.value === "alias");
        if (!hasAlias) {
            throw new Error(
                'Invalid global id field: Types decorated with an `@id` directive with the global argument set to `true` cannot have a field named "id". Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field.'
            );
        }
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath: ["id"] };
}

function assertValidGlobalID(
    directiveNode: DirectiveNode,
    typeDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    typeNameToGlobalId: Map<string, boolean>,
    interfaceToImplementingTypes: Map<string, string[]>
): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };
    try {
        console.log(
            "checking for",
            typeDef.name.value,
            typeDef.interfaces,
            interfaceToImplementingTypes.get(typeDef.name.value)
        );
        const globalNodeStatus = typeNameToGlobalId.get(typeDef.name.value);
        const globalNodeStatusFromInterface = typeDef.interfaces?.map((i) => typeNameToGlobalId.get(i.name.value));
        const globalNodeStatusFromType = interfaceToImplementingTypes
            .get(typeDef.name.value)
            ?.map((typeName) => typeNameToGlobalId.get(typeName));
        if (
            globalNodeStatus === true ||
            globalNodeStatusFromInterface?.some((s) => s === true) ||
            globalNodeStatusFromType?.some((s) => s === true)
        ) {
            errorPath = ["@id", "global"];
            throw new Error(
                "Invalid directive usage: Only one field may be decorated with an '@id' directive with the global argument set to `true`."
            );
        } else {
            typeNameToGlobalId.set(typeDef.name.value, true);
        }

        const isNotUnique = directiveNode.arguments?.find(
            (a) => a.name.value === "unique" && a.value.kind === Kind.BOOLEAN && a.value.value === false
        );
        if (isNotUnique) {
            errorPath = ["@id", "unique"];
            throw new Error(
                `Invalid global id field: Fields decorated with the "@id" directive must be unique in the database. Please remove it, or consider making the field unique.`
            );
        }
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath };
}
