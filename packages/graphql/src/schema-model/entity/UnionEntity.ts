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

import { plural, singular } from "pluralize";
import { Memoize } from "typescript-memoize";
import type { Annotations } from "../annotation/Annotation";
import type { CompositeEntity } from "./CompositeEntity";
import type { ConcreteEntity } from "./ConcreteEntity";

export class UnionEntity implements CompositeEntity {
    public readonly name: string;
    public concreteEntities: ConcreteEntity[];
    public readonly annotations: Partial<Annotations>;

    constructor({
        name,
        concreteEntities,
        annotations = {},
    }: {
        name: string;
        concreteEntities: ConcreteEntity[];
        annotations?: Partial<Annotations>;
    }) {
        this.name = name;
        this.concreteEntities = concreteEntities;
        this.annotations = annotations;
    }

    isConcreteEntity(): this is ConcreteEntity {
        return false;
    }
    isCompositeEntity(): this is CompositeEntity {
        return true;
    }

    // Duplicate in EntityAdapters
    @Memoize()
    public get plural(): string {
        if (this.annotations.plural) {
            return singular(this.annotations.plural.value);
        }
        return plural(this.name);
    }
}
