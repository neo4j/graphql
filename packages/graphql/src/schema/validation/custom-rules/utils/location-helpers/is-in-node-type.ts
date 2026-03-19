/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { type ASTNode } from "graphql";
import { nodeDirective } from "../../../../../graphql/directives";
import type { TypeMapWithExtensions } from "../../../Neo4jValidationContext";
import { getParentType } from "./get-parent-type";

export function fieldIsInNodeType({
    path,
    ancestors,
    typeMapWithExtensions,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    const parentTypeAndExtensions = getParentType({ path, ancestors, typeMapWithExtensions });
    const allDirectives = [
        ...(parentTypeAndExtensions.definition.directives ?? []),
        ...parentTypeAndExtensions.extensions.flatMap((ext) => ext.directives ?? []),
    ];
    return !!allDirectives?.find((directive) => directive.name.value === nodeDirective.name);
}
