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
