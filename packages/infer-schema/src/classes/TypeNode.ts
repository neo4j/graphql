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

import { NodeDirective } from "./NodeDirective";
import { NodeField } from "./NodeField";

type NodeDirectives = {
    node: NodeDirective;
};

export class TypeNode {
    label: string;
    typeName: string;
    fields: NodeField[] = [];
    directives: NodeDirectives = { node: new NodeDirective() };
    constructor(typeName: string, label: string, additionalLabels: string[] = []) {
        this.typeName = typeName;
        this.label = label;
        if (this.label !== this.typeName) {
            this.directives.node.addLabel(this.label);
        }
        this.directives.node.addAdditionalLabels(additionalLabels);
    }

    addField(field: NodeField) {
        this.fields.push(field);
    }

    toString() {
        const parts: (string | string[])[] = [];
        let innerParts: string[] = [];
        innerParts = innerParts.concat(this.fields.map((field) => field.toString()));

        parts.push(`type ${this.typeName} ${this.directives.node.toString()}{`);
        parts.push(innerParts);
        parts.push(`}`);
        return parts.map((p) => (Array.isArray(p) ? `\t${p.join("\n\t")}` : p)).join("\n");
    }
}
