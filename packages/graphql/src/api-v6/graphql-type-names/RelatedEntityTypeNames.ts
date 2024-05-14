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

import type { Relationship } from "../../schema-model/relationship/Relationship";
import { upperFirst } from "../../utils/upper-first";
import { EntityTypeNames } from "./EntityTypeNames";

/** Typenames for a related entity, including edge properties */
export class RelatedEntityTypeNames extends EntityTypeNames {
    private relationship: Relationship;
    private relatedEntityTypeName: string;

    constructor(relationship: Relationship) {
        super(relationship.target);

        this.relatedEntityTypeName = `${relationship.source.name}${upperFirst(relationship.name)}`;
        this.relationship = relationship;
    }

    public get connectionOperation(): string {
        return `${this.relatedEntityTypeName}Operation`;
    }

    public get connection(): string {
        return `${this.relatedEntityTypeName}Connection`;
    }

    public get connectionSort(): string {
        return `${this.relatedEntityTypeName}ConnectionSort`;
    }

    public get edge(): string {
        return `${this.relatedEntityTypeName}Edge`;
    }

    public get edgeSort(): string {
        return `${this.relatedEntityTypeName}EdgeSort`;
    }

    public get whereInput(): string {
        return `${this.relatedEntityTypeName}Where`;
    }

    public get properties(): string | undefined {
        return this.relationship.propertiesTypeName;
    }

    public get propertiesSort(): string | undefined {
        if (!this.relationship.propertiesTypeName) {
            return;
        }
        return `${this.relationship.propertiesTypeName}Sort`;
    }
}
