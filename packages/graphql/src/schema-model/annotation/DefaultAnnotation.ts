/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export type DefaultAnnotationValue = string | number | boolean;

export class DefaultAnnotation implements Annotation {
    readonly name = "default";

    public readonly value: DefaultAnnotationValue;

    constructor({ value }: { value: DefaultAnnotationValue }) {
        this.value = value;
    }
}
