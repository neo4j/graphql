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

import type { Annotations } from "../../annotation/Annotation";
import { plural, singular } from "../../utils/string-manipulation";
import type { ConcreteEntity } from "../ConcreteEntity";
import type { UnionEntity } from "../UnionEntity";
import { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";
import { UnionEntityOperations } from "./UnionEntityOperations";

export class UnionEntityAdapter {
    public readonly name: string;
    public concreteEntities: ConcreteEntityAdapter[];

    public readonly annotations: Partial<Annotations>;

    private _singular: string | undefined;
    private _plural: string | undefined;

    // specialize models
    private _operations: UnionEntityOperations | undefined;

    constructor(entity: UnionEntity) {
        this.name = entity.name;
        this.concreteEntities = [];
        this.initConcreteEntities(entity.concreteEntities);
        this.annotations = entity.annotations;
    }

    private initConcreteEntities(entities: ConcreteEntity[]) {
        for (const entity of entities) {
            const entityAdapter = new ConcreteEntityAdapter(entity);
            this.concreteEntities.push(entityAdapter);
        }
    }

    get operations(): UnionEntityOperations {
        if (!this._operations) {
            return new UnionEntityOperations(this);
        }
        return this._operations;
    }

    public get singular(): string {
        if (!this._singular) {
            this._singular = singular(this.name);
        }
        return this._singular;
    }

    public get plural(): string {
        if (!this._plural) {
            if (this.annotations.plural) {
                this._plural = singular(this.annotations.plural.value);
            } else {
                this._plural = plural(this.name);
            }
        }
        return this._plural;
    }

    get isReadable(): boolean {
        return this.annotations.query === undefined || this.annotations.query.read === true;
    }
}
