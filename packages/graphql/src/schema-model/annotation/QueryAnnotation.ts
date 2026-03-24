/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotation } from "./Annotation";

export class QueryAnnotation implements Annotation {
    readonly name = "query";
    public readonly read: boolean;
    public readonly aggregate: boolean;
    public readonly connection: boolean;

    constructor({ read, aggregate, connection }: { read: boolean; aggregate: boolean; connection: boolean }) {
        this.read = read;
        this.aggregate = aggregate;
        this.connection = connection;
    }
}
