/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ConcreteEntity } from "./ConcreteEntity";
import type { Entity } from "./Entity";

/** models the concept of an Abstract Type */
export interface CompositeEntity extends Entity {
    concreteEntities: ConcreteEntity[];
}
