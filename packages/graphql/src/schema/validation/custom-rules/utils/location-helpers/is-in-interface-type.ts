/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind, type ASTNode } from "graphql";
import type { TypeMapWithExtensions } from "../../../Neo4jValidationContext";
import { getParentType } from "./get-parent-type";

export function fieldIsInInterfaceType({
    path,
    ancestors,
    typeMapWithExtensions,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    const parentTypeAndExtensions = getParentType({ path, ancestors, typeMapWithExtensions });
    return parentTypeAndExtensions.definition.kind === Kind.INTERFACE_TYPE_DEFINITION;
}
