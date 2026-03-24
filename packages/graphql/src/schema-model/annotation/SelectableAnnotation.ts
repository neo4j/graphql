/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class SelectableAnnotation implements Annotation {
    readonly name = "selectable";
    public readonly onRead: boolean;
    public readonly onAggregate: boolean;

    constructor({ onRead, onAggregate }: { onRead: boolean; onAggregate: boolean }) {
        this.onRead = onRead;
        this.onAggregate = onAggregate;
    }
}
