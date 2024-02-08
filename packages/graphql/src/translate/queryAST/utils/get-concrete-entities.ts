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

import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";

import { isConcreteEntity } from "./is-concrete-entity";
import { isUnionEntity } from "./is-union-entity";

/**
 * Returns the concrete entities presents in the where argument,
 * for interface this implicit behavior was substituted by the typename filters therefore we return all the concrete entities,
 * if the where argument is not defined then returns all the concrete entities of the composite target.
 * In case of concrete entities returns the entity itself.
 **/
export function getConcreteEntities(target: EntityAdapter, whereArgs?: Record<string, any>): ConcreteEntityAdapter[] {
    if (isConcreteEntity(target)) {
        return [target];
    }
    if (isUnionEntity(target)) {
        return getConcreteEntitiesInOnArgumentOfWhereUnion(target, whereArgs);
    }

    return target.concreteEntities;
}

function getConcreteEntitiesInOnArgumentOfWhereUnion(
    compositeTarget: UnionEntityAdapter,
    whereArgs?: Record<string, any>
): ConcreteEntityAdapter[] {
    if (!whereArgs || countObjectKeys(whereArgs) === 0) {
        return compositeTarget.concreteEntities;
    }
    return getMatchingConcreteEntity(compositeTarget, whereArgs);
}

function getMatchingConcreteEntity(
    compositeTarget: UnionEntityAdapter | InterfaceEntityAdapter,
    whereArgs: Record<string, any>
): ConcreteEntityAdapter[] {
    const concreteEntities: ConcreteEntityAdapter[] = [];
    for (const concreteEntity of compositeTarget.concreteEntities) {
        if (whereArgs[concreteEntity.name]) {
            concreteEntities.push(concreteEntity);
        }
    }
    return concreteEntities;
}

function countObjectKeys(obj: Record<string, any>): number {
    return Object.keys(obj).length;
}
