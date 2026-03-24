/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

/**
 * Type matching the elements in object/array
 */
export type ValueOf<T extends ReadonlyArray<unknown> | Array<unknown>> = T[number];
