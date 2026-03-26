/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class TimestampAnnotation implements Annotation {
    readonly name = "timestamp";
    public readonly operations: string[];

    constructor({ operations }: { operations: string[] }) {
        this.operations = operations;
    }
}
