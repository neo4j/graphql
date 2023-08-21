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

import type { ASTVisitor, DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { createGraphQLError, assertValid, DocumentValidationError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";
import * as directives from "../../../../graphql/directives";
import { typeDependantDirectivesScaffolds } from "../../../../graphql/directives/type-dependant-directives/scaffolds";

/** only the @cypher directive is valid on fields of Root types: Query, Mutation; no directives valid on fields of Subscription */
export function ValidDirectiveAtLocation(context: SDLValidationContext): ASTVisitor {
    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            if (!traversedDef) {
                console.error("No last definition traversed");
                return;
            }
            const shouldRunThisRule =
                parentOfTraversedDef &&
                parentOfTraversedDef.kind === Kind.OBJECT_TYPE_DEFINITION &&
                ["Query", "Mutation", "Subscription"].includes(parentOfTraversedDef.name.value);

            if (!shouldRunThisRule) {
                return;
            }
            const { isValid, errorMsg, errorPath } = assertValid(() =>
                isDirectiveValidAtLocation({
                    directiveNode,
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

function isDirectiveValidAtLocation({
    directiveNode,
    parentDef,
}: {
    directiveNode: DirectiveNode;
    parentDef: ObjectTypeDefinitionNode;
}) {
    if (directiveNode.name.value === "cypher" && parentDef.name.value !== "Subscription") {
        return;
    }
    const allDirectivesDefinedByNeo4jGraphQL = Object.values(directives).concat(typeDependantDirectivesScaffolds);
    const directiveAtInvalidLocation = allDirectivesDefinedByNeo4jGraphQL.find(
        (d) => d.name === directiveNode.name.value
    );
    if (directiveAtInvalidLocation) {
        throw new DocumentValidationError(
            `Invalid directive usage: Directive @${directiveAtInvalidLocation.name} is not supported on fields of the ${parentDef.name.value} type.`,
            [`@${directiveNode.name.value}`]
        );
    }
}
