/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { type ASTNode } from "graphql";
import type { TypeMapWithExtensions } from "../../../Neo4jValidationContext";
import { getParentType } from "./get-parent-type";

export function fieldIsInSubscriptionType({
    path,
    ancestors,
    typeMapWithExtensions,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    const parentTypeAndExtensions = getParentType({ path, ancestors, typeMapWithExtensions });
    return parentTypeAndExtensions.definition.name.value === "Subscription";
}
