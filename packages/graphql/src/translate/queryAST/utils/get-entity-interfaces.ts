/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { InterfaceEntity } from "../../../schema-model/entity/InterfaceEntity";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { filterTruthy } from "../../../utils/utils";

/**
 *  Return all the interfaces the provided concrete entity inherits
 *  Note that this functions accepts and returns Adapters, not the raw entities
 */
export function getEntityInterfaces(entity: ConcreteEntityAdapter): InterfaceEntityAdapter[] {
    return filterTruthy(
        entity.compositeEntities.map((compositeEntity) => {
            if (compositeEntity instanceof InterfaceEntity) {
                return new InterfaceEntityAdapter(compositeEntity);
            }
        })
    );
}
