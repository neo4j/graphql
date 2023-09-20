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

import type { ConcreteEntity } from "../ConcreteEntity";
import type { UnionEntity } from "../UnionEntity";
import { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";

export class UnionEntityAdapter {
    public readonly name: string;
    public concreteEntities: ConcreteEntityAdapter[];

    constructor(entity: UnionEntity) {
        this.name = entity.name;
        this.concreteEntities = [];
        this.initConcreteEntities(entity.concreteEntities);
    }

    private initConcreteEntities(entities: ConcreteEntity[]) {
        for (const entity of entities) {
            const entityAdapter = new ConcreteEntityAdapter(entity);
            this.concreteEntities.push(entityAdapter);
        }
    }

}
