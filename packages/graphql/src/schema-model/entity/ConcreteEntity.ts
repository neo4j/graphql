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

import type { Attribute } from "../attribute/Attribute";
import type { Entity } from "./Entity";

export class ConcreteEntity implements Entity {
    public readonly name: string;
    public readonly labels: Set<string>;
    public readonly attributes: Map<string, Attribute> = new Map();

    constructor({ name, labels, attributes = [] }: { name: string; labels: string[]; attributes?: Attribute[] }) {
        this.name = name;
        this.labels = new Set(labels);
        for (const attribute of attributes) {
            this.addAttribute(attribute);
        }
    }

    public matchLabels(labels: string[]) {
        return this.setsAreEqual(new Set(labels), this.labels);
    }

    private addAttribute(attribute: Attribute): void {
        if (this.attributes.has(attribute.name)) {
            throw new Error(`Attribute ${attribute.name} already exists in ${this.name}`);
        }
        this.attributes.set(attribute.name, attribute);
    }

    private setsAreEqual(a: Set<string>, b: Set<string>): boolean {
        if (a.size !== b.size) {
            return false;
        }

        return Array.from(a).every((element) => {
            return b.has(element);
        });
    }
}
