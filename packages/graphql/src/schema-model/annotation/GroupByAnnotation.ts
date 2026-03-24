/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class GroupByAnnotation implements Annotation {
    readonly name = "groupBy";
}
