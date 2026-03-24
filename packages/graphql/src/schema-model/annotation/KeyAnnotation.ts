/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class KeyAnnotation implements Annotation {
    readonly name = "key";
    // fields from the @key directive is intentionally excluded as it is not in use by our schema model
    public resolvable: boolean; // Defaults to true

    constructor({ resolvable = true }: { resolvable?: boolean }) {
        this.resolvable = resolvable;
    }
}
