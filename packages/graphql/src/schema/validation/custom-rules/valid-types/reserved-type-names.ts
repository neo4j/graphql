/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type {
    ASTNode,
    ASTVisitor,
    EnumTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    UnionTypeDefinitionNode,
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
