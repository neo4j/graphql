/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { isUnionEntity } from "./is-union-entity";

export function getConcreteWhere(
    compositeTarget: UnionEntityAdapter | InterfaceEntityAdapter,
    concreteTarget: ConcreteEntityAdapter,
    whereArgs?: Record<string, any>
): Record<string, any> {
    if (!whereArgs) {
        return {};
    }
    if (isUnionEntity(compositeTarget)) {
        return whereArgs[concreteTarget.name] ?? {};
    }
    return whereArgs;
}
