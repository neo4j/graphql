/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Direction, Directive } from "../types";

export class RelationshipDirective implements Directive {
    direction: Direction;
    type: string;
    propertiesReference?: string;
    constructor(type: string, direction: Direction, propertiesReference?: string) {
        this.type = type;
        this.direction = direction;
        this.propertiesReference = propertiesReference;
    }

    toString(): string {
        const args: string[] = [];
        args.push(`type: "${this.type}"`);
        args.push(`direction: ${this.direction}`);
        if (this.propertiesReference) {
            args.push(`properties: "${this.propertiesReference}"`);
        }
        return `@relationship(${args.join(", ")})`;
    }
}
