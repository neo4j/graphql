/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export type Direction = "IN" | "OUT";
export interface Directive {
    toString(): string;
}

export type ExcludeOperation = "CREATE" | "READ" | "UPDATE" | "DELETE";
