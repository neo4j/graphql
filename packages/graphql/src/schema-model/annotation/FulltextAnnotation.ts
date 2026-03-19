/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export type FulltextField = {
    indexName: string;
    queryName: string;
    fields: string[];
};

export class FulltextAnnotation implements Annotation {
    readonly name = "fulltext";
    public readonly indexes: FulltextField[];

    constructor({ indexes }: { indexes: FulltextField[] }) {
        this.indexes = indexes;
    }
}
