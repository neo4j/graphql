/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export default function cleanTypeName(typeName: string): string {
    // :`Type` -> Type
    return typeName.slice(2, -1);
}
