/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export default function generateGraphQLSafeName(input: string): string {
    // Replace all non supported characters
    const name = input.replace(/[^_0-9A-Z]+/gi, "_");
    // GraphQL types cannot start with a number
    return name.replace(/^([0-9])/, "_$1");
}
