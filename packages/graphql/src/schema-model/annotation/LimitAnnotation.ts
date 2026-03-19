/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class LimitAnnotation implements Annotation {
    readonly name = "limit";
    default?: number;
    max?: number;

    constructor({ default: _default, max }: { default?: number; max?: number }) {
        this.default = _default;
        this.max = max;
    }
}
