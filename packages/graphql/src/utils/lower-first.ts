/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export function lowerFirst(str: string): string {
    return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
}
