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

import type { Operation } from "./Operation";
import type { Annotations } from "./annotation/Annotation";
import type { CompositeEntity } from "./entity/CompositeEntity";
import type { ConcreteEntity } from "./entity/ConcreteEntity";
import type { Entity } from "./entity/Entity";
import { ConcreteEntityAdapter } from "./entity/model-adapters/ConcreteEntityAdapter";

export type Operations = {
    Query?: Operation;
    Mutation?: Operation;
    Subscription?: Operation;
};

/** Represents the internal model for the Neo4jGraphQL schema */
export class Neo4jGraphQLSchemaModel {
    public entities: Map<string, Entity>;
    public concreteEntities: ConcreteEntity[];
    public compositeEntities: CompositeEntity[];
    public operations: Operations;
    public readonly annotations: Partial<Annotations>;

    constructor({
        concreteEntities,
        compositeEntities,
        operations,
        annotations = {},
    }: {
        concreteEntities: ConcreteEntity[];
        compositeEntities: CompositeEntity[];
        operations: Operations;
        annotations?: Partial<Annotations>;
    }) {
        this.entities = [...compositeEntities, ...concreteEntities].reduce((acc, entity) => {
            acc.set(entity.name, entity);
            return acc;
        }, new Map<string, Entity>());

        this.concreteEntities = concreteEntities;
        this.compositeEntities = compositeEntities;
        this.operations = operations;
        this.annotations = annotations;
    }

    public getEntity(name: string): Entity | undefined {
        return this.entities.get(name);
    }

    public getConcreteEntityAdapter(name: string): ConcreteEntityAdapter | undefined {
        const concreteEntity = this.concreteEntities.find((entity) => entity.name === name);
        return concreteEntity ? new ConcreteEntityAdapter(concreteEntity) : undefined;
    }

    public getConcreteEntity(name: string): ConcreteEntity | undefined {
        return this.concreteEntities.find((entity) => entity.name === name);
    }

    public getEntitiesByLabels(labels: string[]): ConcreteEntity[] {
        return this.concreteEntities.filter((entity) => entity.matchLabels(labels));
    }

    public getEntitiesByNameAndLabels(name: string, labels: string[]): ConcreteEntity[] {
        return this.concreteEntities.filter((entity) => entity.name === name && entity.matchLabels(labels));
    }
}
