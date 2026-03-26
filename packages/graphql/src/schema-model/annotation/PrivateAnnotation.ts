/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class PrivateAnnotation implements Annotation {
    readonly name = "private";
}
