/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

/**
 * Utility function to ensure that the key exists in the map and avoid unnecessary type casting.
 * Get the value from a map, if the key does not exist throw an error.
 *
 * */
export function getFromMap<K extends keyof any, V>(map: Map<K, V>, key: K): V {
    const item = map.get(key);
    if (item === undefined) {
        throw new Error(`Key "${String(key)}" does not exist in the map.`);
    }
    return item;
}
