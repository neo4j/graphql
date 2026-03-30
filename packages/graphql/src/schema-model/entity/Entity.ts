/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotations } from "../annotation/Annotation";
import type { CompositeEntity } from "./CompositeEntity";
import type { ConcreteEntity } from "./ConcreteEntity";

export interface Entity {
    readonly name: string;
    readonly annotations: Partial<Annotations>;

    get plural(): string;

    isConcreteEntity(): this is ConcreteEntity;
    isCompositeEntity(): this is CompositeEntity;

    // attributes
    // relationships
    // annotations
}
