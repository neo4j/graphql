/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export function escapeQuery(query: string): string {
    // TODO: Should single quotes be escaped?
    // return query.replace(/("|')/g, "\\$1");
    return query.replace(/("|\\)/g, "\\$1");
}
