/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Directive } from "./types";
import { NodeField } from "./NodeField";

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

        innerParts = innerParts.concat(this.fields.map((field) => field.toString()));

        parts.push(typeRow.join(" "));
        parts.push(innerParts);
        parts.push(`}`);
        return parts.map((p) => (Array.isArray(p) ? `\t${p.join("\n\t")}` : p)).join("\n");
    }
}
