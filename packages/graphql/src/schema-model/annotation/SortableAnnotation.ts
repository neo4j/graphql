/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class SortableAnnotation implements Annotation {
    readonly name = "sortable";
    public readonly byValue: boolean;

    constructor({ byValue }: { byValue: boolean }) {
        this.byValue = byValue;
    }
}
