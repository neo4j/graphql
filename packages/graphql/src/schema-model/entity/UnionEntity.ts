/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
