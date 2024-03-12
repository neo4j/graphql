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
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import * as directives from "../../../../graphql/directives";
import { typeDependantDirectivesScaffolds } from "../../../../graphql/directives/type-dependant-directives/scaffolds";
import { SCHEMA_CONFIGURATION_FIELD_DIRECTIVES } from "../../../../schema-model/library-directives";
import { isInArray } from "../../../../utils/is-in-array";
import { DocumentValidationError, assertValid, createGraphQLError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getPathToNode } from "../utils/path-parser";

export function ValidDirectiveAtFieldLocation(context: SDLValidationContext): ASTVisitor {
    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            if (!traversedDef || traversedDef.kind !== Kind.FIELD_DEFINITION) {
                // this rule only checks field location
                return;
            }
            if (!parentOfTraversedDef) {
                console.error("No parent of last definition traversed");
                return;
            }
            const shouldRunThisRule = isDirectiveValidAtLocation({
                directiveNode,
                traversedDef,
                parentDef: parentOfTraversedDef,
            });

            if (!shouldRunThisRule) {
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(shouldRunThisRule);
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
    traversedDef,
    parentDef,
}: {
    directiveNode: DirectiveNode;
    traversedDef: FieldDefinitionNode;
    parentDef: ObjectOrInterfaceWithExtensions;
}) {
    if (isLocationFieldOfRootType(parentDef)) {
        return () =>
            validFieldOfRootTypeLocation({
                directiveNode,
                traversedDef: traversedDef,
                parentDef,
            });
    }
    if (isLocationFieldOfInterfaceType(parentDef)) {
        return () =>
            validFieldOfInterfaceTypeLocation({
                directiveNode,
                parentDef,
            });
    }

    return;
}

function isLocationFieldOfRootType(
    parentDef: ObjectOrInterfaceWithExtensions
): parentDef is ObjectTypeDefinitionNode | ObjectTypeExtensionNode {
    return (
        parentDef &&
        (parentDef.kind === Kind.OBJECT_TYPE_DEFINITION || parentDef.kind === Kind.OBJECT_TYPE_EXTENSION) &&
        ["Query", "Mutation", "Subscription"].includes(parentDef.name.value)
    );
}

function isLocationFieldOfInterfaceType(
    parentDef: ObjectOrInterfaceWithExtensions
): parentDef is InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode {
    return (
        parentDef &&
        (parentDef.kind === Kind.INTERFACE_TYPE_DEFINITION || parentDef.kind === Kind.INTERFACE_TYPE_EXTENSION)
    );
}

function noDirectivesAllowedAtLocation({
    directiveNode,
    parentDef,
}: {
    directiveNode: DirectiveNode;
    parentDef: ObjectOrInterfaceWithExtensions;
}) {
    const allDirectivesDefinedByNeo4jGraphQL = Object.values(directives).concat(typeDependantDirectivesScaffolds);
    const directiveAtInvalidLocation = allDirectivesDefinedByNeo4jGraphQL.find(
        (d) => d.name === directiveNode.name.value
    );
    if (directiveAtInvalidLocation) {
        if (directiveAtInvalidLocation.name === "relationship" && parentDef.kind === Kind.INTERFACE_TYPE_DEFINITION) {
            throw new DocumentValidationError(
                `Invalid directive usage: Directive @${directiveAtInvalidLocation.name} is not supported on fields of interface types (${parentDef.name.value}). Since version 5.0.0, interface fields can only have @declareRelationship. Please add the @relationship directive to the fields in all types which implement it.`,
                [`@${directiveNode.name.value}`]
            );
        } else {
            throw new DocumentValidationError(
                `Invalid directive usage: Directive @${directiveAtInvalidLocation.name} is not supported on fields of the ${parentDef.name.value} type.`,
                [`@${directiveNode.name.value}`]
            );
        }
    }
}

/** only the @cypher and @authentication directives are valid on fields of Root types: Query, Mutation; no directives valid on fields of Subscription */
function validFieldOfRootTypeLocation({
    directiveNode,
    traversedDef,
    parentDef,
}: {
    directiveNode: DirectiveNode;
    traversedDef: FieldDefinitionNode;
    parentDef: ObjectTypeDefinitionNode | ObjectTypeExtensionNode;
}) {
    if (parentDef.name.value !== "Subscription") {
        // some directives are valid on Query | Mutation
        if (directiveNode.name.value === "cypher") {
            // @cypher is valid
            return;
        }
        if (directiveNode.name.value === "authentication") {
            // @authentication is valid
            return;
        }
        const isDirectiveCombinedWithCypher = traversedDef.directives?.some(
            (directive) => directive.name.value === "cypher"
        );
        // explicitly checked for "enhanced" error messages
        if (directiveNode.name.value === "authorization" && isDirectiveCombinedWithCypher) {
            throw new DocumentValidationError(
                `Invalid directive usage: Directive @authorization is not supported on fields of the ${parentDef.name.value} type. Did you mean to use @authentication?`,
                [`@${directiveNode.name.value}`]
            );
        }
    }
    noDirectivesAllowedAtLocation({ directiveNode, parentDef });
}

/** only a subset of field directives are allowed on interface fields */
function validFieldOfInterfaceTypeLocation({
    directiveNode,
    parentDef,
}: {
    directiveNode: DirectiveNode;
    parentDef: InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode;
}) {
    if (isInArray(SCHEMA_CONFIGURATION_FIELD_DIRECTIVES, directiveNode.name.value)) {
        return;
    }
    if (directiveNode.name.value === "declareRelationship") {
        // allow @declareRelationship as an instruction for schema generation
        return;
    }
    if (directiveNode.name.value === "private") {
        // allow @private for now
        return;
    }

    noDirectivesAllowedAtLocation({ directiveNode, parentDef });
}
