/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

/** Checks if element is in array, and checks its type */
export function isInArray<T>(arr: Array<T> | ReadonlyArray<T>, element: unknown): element is T {
    return arr.includes(element as any);
}
