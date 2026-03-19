/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Property from "./Property";
import type Relationship from "./Relationship";

export default class Node {
    typeId: string;
    labels: string[];
    properties: Property[] = [];
    relationships: Relationship[] = [];

    constructor(typeId: string, labels: string[]) {
        this.typeId = typeId;
        this.labels = labels;
    }

    addProperty(property: Property): void {
        this.properties.push(property);
    }

    addRelationship(relationship: Relationship): void {
        this.relationships.push(relationship);
    }
}
