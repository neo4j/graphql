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

import type { Annotations } from "./annotation/Annotation";
import type { Attribute } from "./attribute/Attribute";
import { AttributeAdapter } from "./attribute/model-adapters/AttributeAdapter";
import type { Operation } from "./Operation";

export class OperationAdapter {
    public readonly name: string;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly userResolvedAttributes: Map<string, AttributeAdapter> = new Map();
    public readonly annotations: Partial<Annotations>;

    constructor(entity: Operation) {
        this.name = entity.name;
        this.initAttributes(entity.attributes);
        this.initUserResolvedAttributes(entity.userResolvedAttributes);
        this.annotations = entity.annotations;
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
        }
    }
    private initUserResolvedAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.userResolvedAttributes.set(attributeName, attributeAdapter);
        }
    }

    public get objectFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isObjectField());
    }
}
