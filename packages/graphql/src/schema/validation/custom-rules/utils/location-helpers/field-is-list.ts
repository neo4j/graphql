/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { TypeNode } from "graphql";
import { Kind } from "graphql";

export function fieldIsList(typeNode: TypeNode): boolean {
    if (typeNode.kind === Kind.LIST_TYPE) {
        return true;
    }
    if (typeNode.kind === Kind.NON_NULL_TYPE) {
        return fieldIsList(typeNode.type);
    }
    return false;
}
