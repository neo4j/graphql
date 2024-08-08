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

import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { FactoryParseError } from "../factory-parse-error";

/**
 * Get the attribute from the entity, in case it doesn't exist throw an error
 **/
export function getAttribute(entity: ConcreteEntityAdapter, key: string): AttributeAdapter {
    const attribute = entity.attributes.get(key);
    if (!attribute) {
        throw new FactoryParseError(`Transpile Error: Input field ${key} not found in entity ${entity.name}`);
    }
    return attribute;
}
