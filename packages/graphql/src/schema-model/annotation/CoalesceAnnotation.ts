/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export type CoalesceAnnotationValue = string | number | boolean;

export class CoalesceAnnotation implements Annotation {
    readonly name = "coalesce";

    public readonly value: CoalesceAnnotationValue;

    constructor({ value }: { value: CoalesceAnnotationValue }) {
        this.value = value;
    }
}
