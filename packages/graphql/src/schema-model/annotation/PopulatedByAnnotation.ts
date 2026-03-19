/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class PopulatedByAnnotation implements Annotation {
    readonly name = "populatedBy";
    public readonly callback: string;
    public readonly operations: string[];

    constructor({ callback, operations }: { callback: string; operations: string[] }) {
        this.callback = callback;
        this.operations = operations;
    }
}
