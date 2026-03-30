/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export type VectorField = {
    indexName: string;
    embeddingProperty: string;
    queryName: string;
    provider?: string;
    callback?: string;
};

export class VectorAnnotation implements Annotation {
    readonly name = "vector";
    public readonly indexes: VectorField[];

    constructor({ indexes }: { indexes: VectorField[] }) {
        this.indexes = indexes;
    }
}
