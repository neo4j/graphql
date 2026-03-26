/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { TypeDefinitionNode } from "graphql";

const rootTypes = ["Query", "Mutation", "Subscription"];

export function isRootType(definition: TypeDefinitionNode): boolean {
    return rootTypes.includes(definition.name.value);
}
