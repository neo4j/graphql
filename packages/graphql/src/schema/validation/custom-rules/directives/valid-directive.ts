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
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind, parse, GraphQLError } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import type { Neo4jGraphQLCallbacks } from "../../../../types";
import type { IResolvers } from "@graphql-tools/utils";
import { asArray } from "../../../../utils/utils";
import { verifyCoalesce } from "./coalesce";
import { verifyDefault } from "./default";
import { verifyFulltext } from "./fulltext";
import { verifyPopulatedBy } from "./populatedBy";
import { verifyQueryOptions } from "./queryOptions";
import { verifyRelationshipArgumentValue } from "./relationship";
import type { VALIDATION_FN } from "../utils/document-validation-error";
import { assertValid } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";

function getValidationFunction(
    directiveName: string,
    relationshipTypeToDirectionAndFieldTypeMap: Map<string, [string, string][]>,
    objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap: Map<
        string,
        Map<string, [string, string, string][]>
    >,
    interfaceToImplementationsMap: Map<string, Set<string>>,
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    },
    callbacks?: Neo4jGraphQLCallbacks,
    validateResolvers = true
): VALIDATION_FN | undefined {
    switch (directiveName) {
        case "coalesce":
            return verifyCoalesce(extra?.enums);
        case "default":
            return verifyDefault(extra?.enums);
        case "fulltext":
            return verifyFulltext;
        case "populatedBy":
            return verifyPopulatedBy(callbacks);
        case "queryOptions":
            return verifyQueryOptions;
        case "relationship":
            return verifyRelationshipArgumentValue(
                objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap,
                relationshipTypeToDirectionAndFieldTypeMap,
                interfaceToImplementationsMap,
                extra
            );
        default:
            return;
    }
}

export function DirectiveIsValid(
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    },
    callbacks?: Neo4jGraphQLCallbacks,
    validateResolvers = true
) {
    return function (context: SDLValidationContext): ASTVisitor {
        const relationshipTypeToDirectionAndFieldTypeMap = new Map<string, [string, string][]>();
        const objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap = new Map<
            string,
            Map<string, [string, string, string][]>
        >();
        const interfaceToImplementationsMap = new Map<string, Set<string>>();
        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancenstors) {
                const validationFn = getValidationFunction(
                    directiveNode.name.value,
                    relationshipTypeToDirectionAndFieldTypeMap,
                    objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap,
                    interfaceToImplementationsMap,
                    extra,
                    callbacks
                );
                if (!validationFn) {
                    return;
                }

                const [temp, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancenstors);
                const pathToHere = [...temp, `@${directiveNode.name.value}`];

                if (!traversedDef) {
                    console.error("No last definition traversed");
                    return;
                }

                const { isValid, errorMsg, errorPath } = assertValid(
                    validationFn.bind(null, {
                        directiveNode,
                        traversedDef,
                        parentDef: parentOfTraversedDef,
                    })
                );
                if (!isValid) {
                    const errorOpts = {
                        nodes: [directiveNode, traversedDef],
                        path: [...pathToHere, ...errorPath],
                        source: undefined,
                        positions: undefined,
                        originalError: undefined,
                    };

                    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                    context.reportError(
                        new GraphQLError(
                            errorMsg || "error",
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

// TODO: WIP
function verifyCustomResolver(
    fulltextDirective: DirectiveNode,
    traversedDefinition: FieldDefinitionNode,
    errorCallback: (err: Error) => void,
    parentDef?: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    userCustomResolvers?: IResolvers | IResolvers[],
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    },
    validateResolvers = true
) {
    if (!parentDef) {
        // delegate
        return;
    }
    // TODO: maybe memoize?
    const customResolvers = asArray(userCustomResolvers).find((r) => !!r[parentDef.name.value])?.[
        parentDef.name.value
    ] as IResolvers;
    console.log("parent:", parentDef, "traversed", traversedDefinition);
    try {
        if (
            validateResolvers &&
            parentDef.kind !== Kind.INTERFACE_TYPE_DEFINITION &&
            !customResolvers?.[traversedDefinition.name.value]
        ) {
            throw new Error(
                `@customResolver needs a resolver for field \`${traversedDefinition.name.value}\` to be provided.`
            );
        }

        const directiveRequiresArgument = fulltextDirective?.arguments?.find((arg) => arg.name.value === "requires");

        if (!directiveRequiresArgument) {
            // delegate to DirectiveArgumentOfCorrectType
            return;
        }

        if (directiveRequiresArgument?.value.kind !== Kind.STRING) {
            throw new Error("@customResolver.requires is invalid. Expected a String.");
        }

        if (!extra) {
            throw new Error("NEED EXTRA!");
        }

        const selectionSetDocument = parse(`{ ${directiveRequiresArgument.value.value} }`);
        // TODO: need a schema for this..
        // validateSelectionSet(schema, parentDef, selectionSetDocument);
    } catch (err) {
        errorCallback(err as Error);
    }
}
/*
function validateSelectionSet(
    baseSchema: GraphQLSchema,
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    selectionSetDocument: DocumentNode
) {

    const validationSchema = mergeSchemas({
        schemas: [baseSchema],
        typeDefs: `
                schema {
                    query: ${object.name.value}
                }
            `,
        assumeValid: true,
    });
    const errors = validate(validationSchema, selectionSetDocument);
    if (errors.length) {
        throw new Error(
            `@customResolver::: Invalid selection set provided to @customResolver on ${
                object.name.value
            }:\n${errors.join("\n")}`
        );
    }
}
*/
