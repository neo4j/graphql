/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
