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

import { plural } from "pluralize";
import type { ConcreteEntity } from "../schema-model/entity/ConcreteEntity";
import { lowerFirst } from "../utils/lower-first";

export class AuraEntityOperations {
    private readonly concreteEntity: ConcreteEntity;

    constructor(concreteEntity: ConcreteEntity) {
        this.concreteEntity = concreteEntity;
    }

    public get connectionOperation(): string {
        return `${this.concreteEntity.name}Operation`;
    }

    public get connectionType(): string {
        return `${this.concreteEntity.name}Connection`;
    }

    public get edgeType(): string {
        return `${this.concreteEntity.name}Edge`;
    }

    public get nodeType(): string {
        return `${this.concreteEntity.name}`;
    }

    public get whereInputTypeName(): string {
        return `${this.concreteEntity.name}Where`;
    }

    public get plural(): string {
        return plural(lowerFirst(this.concreteEntity.name));
        // if (!this._plural) {
        //     if (this.annotations.plural) {
        //         this._plural = plural(this.annotations.plural.value);
        //     } else {
        //         this._plural = plural(this.name);
        //     }
        // }
        // return this._plural;
    }
}
