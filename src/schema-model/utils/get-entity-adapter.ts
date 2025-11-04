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
