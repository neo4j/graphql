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

import { plural } from "../../schema-model/utils/string-manipulation";

export abstract class EntityTypeNames {
    private readonly prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    public get connectionOperation(): string {
        return `${this.prefix}Operation`;
    }

    public get connection(): string {
        return `${this.prefix}Connection`;
    }

    public get connectionSort(): string {
        return `${this.prefix}ConnectionSort`;
    }

    public get edgeSort(): string {
        return `${this.prefix}EdgeSort`;
    }

    public get edge(): string {
        return `${this.prefix}Edge`;
    }

    public get node(): string {
        return `${this.prefix}`;
    }

    public get whereInput(): string {
        return `${this.prefix}Where`;
    }

    public get queryField(): string {
        return this.plural;
    }

    public get plural(): string {
        return plural(this.prefix);
    }

    public abstract get nodeSort(): string;
}
