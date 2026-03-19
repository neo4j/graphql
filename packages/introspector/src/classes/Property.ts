/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export default class Property {
    name: string;
    types: string[];
    mandatory: boolean;
    constructor(name: string, types: string[], mandatory: boolean) {
        this.name = name;
        this.types = types;
        this.mandatory = mandatory;
    }
}
