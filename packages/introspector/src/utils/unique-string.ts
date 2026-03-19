/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

// This function increases numbers at the end of a string until it's unique in a pool
export default function uniqueString(candidate: string, pool: string[]): string {
    let uniqueStr = candidate;
    let counter = 2;
    while (pool.includes(uniqueStr)) {
        uniqueStr = candidate + String(counter);
        counter += 1;
    }
    return uniqueStr;
}
