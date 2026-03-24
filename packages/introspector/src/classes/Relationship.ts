/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Property from "./Property";

type Path = {
    fromTypeId: string;
    toTypeId: string;
};

export default class Relationship {
    type: string;
    paths: Path[] = [];
    properties: Property[] = [];

    constructor(type: string) {
        this.type = type;
    }

    addProperty(property: Property): void {
        this.properties.push(property);
    }

    addPath(from: string, to: string): void {
        this.paths.push({ fromTypeId: from, toTypeId: to });
    }
}
