/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { NodeField } from "./NodeField";
import type { Directive } from "./types";

type NodeType = "type" | "interface";

export class GraphQLNode {
    type: NodeType;
    typeName: string;
    fields: NodeField[] = [];
    directives: Directive[] = [];
    constructor(type: NodeType, typeName: string) {
        this.type = type;
        this.typeName = typeName;
    }

    addDirective(d: Directive) {
        this.directives.push(d);
    }

    addField(field: NodeField) {
        this.fields.push(field);
    }

    toString() {
        const parts: (string | string[])[] = [];
        let innerParts: string[] = [];
        const typeRow: string[] = [];

        typeRow.push(this.type, this.typeName);
        if (this.directives.length) {
            typeRow.push(this.directives.map((d) => d.toString()).join(" "));
        }
        typeRow.push("{");

        innerParts = innerParts.concat(
            this.fields.sort((a, b) => (a.name > b.name ? 1 : -1)).map((field) => field.toString())
        );

        parts.push(typeRow.join(" "));
        parts.push(innerParts);
        parts.push(`}`);
        return parts.map((p) => (Array.isArray(p) ? `\t${p.join("\n\t")}` : p)).join("\n");
    }
}
