/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Entity } from "../entity/Entity";
import type { EntityAdapter } from "../entity/EntityAdapter";
import { InterfaceEntity } from "../entity/InterfaceEntity";
import { UnionEntity } from "../entity/UnionEntity";
import { ConcreteEntityAdapter } from "../entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../entity/model-adapters/UnionEntityAdapter";

export function getEntityAdapter(entity: Entity): EntityAdapter {
    if (entity instanceof UnionEntity) {
        return new UnionEntityAdapter(entity);
    }
    if (entity instanceof InterfaceEntity) {
        return new InterfaceEntityAdapter(entity);
    }
    if (entity.isConcreteEntity()) {
        return new ConcreteEntityAdapter(entity);
    }
    throw new Error(`Error while trying to build Entity: ${entity.name}`);
}
