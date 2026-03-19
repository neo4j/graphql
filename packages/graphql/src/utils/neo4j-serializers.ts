/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import * as neo4j from "neo4j-driver";

export function serializeNeo4jValue(value: unknown): any {
    if (neo4j.isInt(value)) {
        if (value.inSafeRange()) {
            return value.toNumber();
        }
        // BigInt
        return value.toString();
    }

    return value;
}
