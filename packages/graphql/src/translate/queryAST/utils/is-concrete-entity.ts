/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function isConcreteEntity(entity: EntityAdapter | RelationshipAdapter): entity is ConcreteEntityAdapter {
    return entity instanceof ConcreteEntityAdapter;
}

export function assertIsConcreteEntity(
    entity?: EntityAdapter | RelationshipAdapter
): asserts entity is ConcreteEntityAdapter {
    if (!entity || !isConcreteEntity(entity)) {
        throw new Error("Transpile Error: Expected EntityAdapter to be a ConcreteEntityAdapter");
    }
}
