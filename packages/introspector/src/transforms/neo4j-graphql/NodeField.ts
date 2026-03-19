/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Directive } from "./types";

export class NodeField {
    name: string;
    type: string;
    directives: Directive[] = [];
    constructor(name: string, type: string) {
        this.name = name;
        this.type = type;
    }

    addDirective(d: Directive): void {
        this.directives.push(d);
    }

    toString(): string {
        const directiveString = this.directives?.map((d) => d.toString()).join(" ") || "";
        return `${this.name}: ${this.type}${directiveString ? ` ${directiveString}` : ""}`;
    }
}
