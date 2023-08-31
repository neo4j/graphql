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
    ASTNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode,
    EnumTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
} from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { RESERVED_TYPE_NAMES } from "../../../../constants";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";

type ReservableASTNode =
    | ObjectTypeDefinitionNode
    | ScalarTypeDefinitionNode
    | InterfaceTypeDefinitionNode
    | UnionTypeDefinitionNode
    | EnumTypeDefinitionNode
    | InputObjectTypeDefinitionNode;

export function ReservedTypeNames(context: SDLValidationContext): ASTVisitor {
    return {
        enter(node: ASTNode) {
            if (!isReservableASTNode(node)) {
                return;
            }

            const { isValid, errorMsg } = assertValid(() => assertTypeNameIsReserved(node));
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [node],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function isReservableASTNode(node: ASTNode): node is ReservableASTNode {
    if (
        [
            Kind.OBJECT_TYPE_DEFINITION,
            Kind.SCALAR_TYPE_DEFINITION,
            Kind.INTERFACE_TYPE_DEFINITION,
            Kind.UNION_TYPE_DEFINITION,
            Kind.ENUM_TYPE_DEFINITION,
            Kind.INPUT_OBJECT_TYPE_DEFINITION,
            Kind.INTERFACE_TYPE_EXTENSION,
        ].some((k) => k === node.kind)
    ) {
        return true;
    }
    return false;
}
function assertTypeNameIsReserved(node: ReservableASTNode) {
    RESERVED_TYPE_NAMES.forEach((reservedName) => {
        if (reservedName.regex.test(node.name.value)) {
            throw new DocumentValidationError(reservedName.error, []);
        }
    });
}
