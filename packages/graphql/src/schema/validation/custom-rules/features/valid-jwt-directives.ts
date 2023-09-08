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

import type { ASTVisitor, DirectiveNode, ObjectTypeDefinitionNode, ObjectTypeExtensionNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { GRAPHQL_BUILTIN_SCALAR_TYPES } from "../../../../constants";
import { DocumentValidationError, assertValid, createGraphQLError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getPathToNode } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";

export function ValidJwtDirectives(context: SDLValidationContext): ASTVisitor {
    const jwtTypes = new Map<string, ObjectOrInterfaceWithExtensions[]>();
    const typeMap = new Map<string, ObjectOrInterfaceWithExtensions[]>();
    const defs = context.getDocument().definitions;
    const objectsAndInterfaces: ObjectOrInterfaceWithExtensions[] = defs.filter(
        (d): d is ObjectOrInterfaceWithExtensions =>
            d.kind === Kind.OBJECT_TYPE_DEFINITION ||
            d.kind === Kind.OBJECT_TYPE_EXTENSION ||
            d.kind === Kind.INTERFACE_TYPE_DEFINITION ||
            d.kind === Kind.INTERFACE_TYPE_EXTENSION
    );
    for (const def of objectsAndInterfaces) {
        const prev = typeMap.get(def.name.value) || [];
        typeMap.set(def.name.value, prev.concat(def));

        if (def.directives?.some((d) => d.name.value === "jwt")) {
            // first, scaffold with just typenames
            jwtTypes.set(def.name.value, []);
        }
    }
    // second, populate with definitions
    for (const typeName of jwtTypes.keys()) {
        jwtTypes.set(typeName, typeMap.get(typeName) || []);
    }

    return {
        Directive(node: DirectiveNode, _key, _parent, path, ancestors) {
            const isJwtDirective = node.name.value === "jwt";
            const isJwtClaimDirective = node.name.value === "jwtClaim";
            if (!isJwtDirective && !isJwtClaimDirective) {
                return;
            }

            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            if (!traversedDef) {
                console.error("No last definition traversed");
                return;
            }

            let validationResult;
            let errorPath;
            if (isJwtDirective) {
                if (
                    traversedDef.kind !== Kind.OBJECT_TYPE_DEFINITION &&
                    traversedDef.kind !== Kind.OBJECT_TYPE_EXTENSION
                ) {
                    // delegate to another rule bc cannot use jwt on fields
                    return;
                }
                validationResult = assertValid(() => assertJwtDirective(traversedDef, jwtTypes));
                errorPath = "@jwt";
            } else {
                if (!parentOfTraversedDef) {
                    console.error("No parent of last definition traversed");
                    return;
                }
                validationResult = assertValid(() => assertJwtClaimDirective(jwtTypes, parentOfTraversedDef));
                errorPath = "@jwtClaim";
            }

            const { isValid, errorMsg } = validationResult;
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [node, traversedDef],
                        path: [...pathToNode, errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertJwtDirective(
    objectType: ObjectTypeDefinitionNode | ObjectTypeExtensionNode,
    jwtTypes: Map<string, ObjectOrInterfaceWithExtensions[]>
) {
    const typeNamesForCurrent: string[] = [
        objectType.name.value,
        ...(objectType.interfaces || []).map((i) => i.name.value),
    ];

    for (const typeName of jwtTypes.keys()) {
        if (!typeNamesForCurrent.includes(typeName)) {
            throw new DocumentValidationError(
                `Invalid directive usage: Directive @jwt can only be used once in the Type Definitions.`,
                []
            );
        }
    }

    const mergedDirectivesForCurrent: DirectiveNode[] = [];
    for (const typeName of typeNamesForCurrent) {
        const types = jwtTypes.get(typeName);
        if (!types) {
            continue;
        }
        for (const t of types) {
            mergedDirectivesForCurrent.push(...(t.directives || []));
            if (mergedDirectivesForCurrent.length > 1) {
                throw new DocumentValidationError(
                    `Invalid directive usage: Directive @jwt cannot be used in combination with other directives.`,
                    []
                );
            }
            const incompatibleFieldsStatus = t.fields?.some(
                (field) => !GRAPHQL_BUILTIN_SCALAR_TYPES.includes(getInnerTypeName(field.type))
            );
            if (incompatibleFieldsStatus === true) {
                throw new DocumentValidationError(
                    `Invalid directive usage: Fields of a @jwt type can only be Scalars or Lists of Scalars.`,
                    []
                );
            }
        }
    }
}

function assertJwtClaimDirective(
    jwtTypes: Map<string, ObjectOrInterfaceWithExtensions[]>,
    node: ObjectOrInterfaceWithExtensions
) {
    const typeNamesForCurrent: string[] = [node.name.value, ...(node.interfaces || []).map((i) => i.name.value)];
    for (const typeName of typeNamesForCurrent) {
        if (jwtTypes.has(typeName)) {
            return;
        }
    }

    throw new DocumentValidationError(
        `Invalid directive usage: Directive @jwtClaim can only be used in \\"@jwt\\" types.`,
        []
    );
}
