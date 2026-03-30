/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind, type ASTNode } from "graphql";
import { isRootType } from "../../../../../utils/is-root-type";
import type { TypeMapWithExtensions } from "../../../Neo4jValidationContext";
import { getParentType } from "./get-parent-type";

export function fieldIsInRootType({
    path,
    ancestors,
    typeMapWithExtensions,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    const parentTypeAndExtensions = getParentType({ path, ancestors, typeMapWithExtensions });
    return (
        parentTypeAndExtensions.definition.kind === Kind.OBJECT_TYPE_DEFINITION &&
        isRootType(parentTypeAndExtensions.definition)
    );
}
