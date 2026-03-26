/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class SettableAnnotation implements Annotation {
    readonly name = "settable";
    public readonly onCreate: boolean;
    public readonly onUpdate: boolean;

    constructor({ onCreate, onUpdate }: { onCreate: boolean; onUpdate: boolean }) {
        this.onCreate = onCreate;
        this.onUpdate = onUpdate;
    }
}
