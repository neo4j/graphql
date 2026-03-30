/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class FilterableAnnotation implements Annotation {
    readonly name = "filterable";
    public readonly byValue: boolean;
    public readonly byAggregate: boolean;

    constructor({ byValue, byAggregate }: { byValue: boolean; byAggregate: boolean }) {
        this.byValue = byValue;
        this.byAggregate = byAggregate;
    }
}
