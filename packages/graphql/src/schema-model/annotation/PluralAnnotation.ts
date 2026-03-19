/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

// TODO: maybe this can be a field on the concrete entity
import type { Annotation } from "./Annotation";

export class PluralAnnotation implements Annotation {
    readonly name = "plural";
    public readonly value: string;

    constructor({ value }: { value: string }) {
        this.value = value;
    }
}
