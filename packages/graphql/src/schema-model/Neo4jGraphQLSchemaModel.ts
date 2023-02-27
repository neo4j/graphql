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

import type { CompositeEntity } from "./entity/CompositeEntity";
import type { ConcreteEntity } from "./entity/ConcreteEntity";
import type { Entity } from "./entity/Entity";

/** Represents the internal model for the Neo4jGraphQL schema */
export class Neo4jGraphQLSchemaModel {
    public entities: Map<string, Entity>;
    public concreteEntities: ConcreteEntity[];
    public compositeEntities: CompositeEntity[];

    constructor({
        concreteEntities,
        compositeEntities,
    }: {
        concreteEntities: ConcreteEntity[];
        compositeEntities: CompositeEntity[];
    }) {
        this.entities = [...compositeEntities, ...concreteEntities].reduce((acc, entity) => {
            acc.set(entity.name, entity);
            return acc;
        }, new Map<string, Entity>());
        this.concreteEntities = concreteEntities;
        this.compositeEntities = compositeEntities;
    }

    public getEntitiesByLabels(labels: string[]): ConcreteEntity[] {
        return this.concreteEntities.filter((entity) => entity.matchLabels(labels));
    }
}
