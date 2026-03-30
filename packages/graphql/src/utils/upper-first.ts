/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

/* Sets first letter of the string as toUpperCase */
export function upperFirst(str: string): string {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}
