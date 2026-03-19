/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export function isMultiDbUnsupportedError(e: Error): boolean {
    if (
        e.message.includes("This is an administration command and it should be executed against the system database") ||
        e.message.includes("Unsupported administration command") ||
        e.message.includes("Unable to route write operation to leader for database 'system'") ||
        e.message.includes("CREATE DATABASE is not supported") ||
        e.message.includes("DROP DATABASE is not supported")
    ) {
        return true;
    }

    return false;
}
