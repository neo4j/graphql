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

import type { Entity } from "../../../schema-model/entity/Entity";

/** Abstract class to hold the typenames of a given entity */
export abstract class EntityTypeNames {
    protected readonly entityName: string;

    constructor(entity: Entity) {
        this.entityName = entity.name;
    }

    public get node(): string {
        return `${this.entityName}`;
    }

    public get nodeSort(): string {
        return `${this.entityName}Sort`;
    }

    public abstract get connectionOperation(): string;
    public abstract get connection(): string;
    public abstract get connectionSort(): string;
    public abstract get edge(): string;
    public abstract get edgeSort(): string;
    public abstract get whereInput(): string;
}
