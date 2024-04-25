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

import { Neo4jGraphQLError } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { isConcreteEntity } from "./is-concrete-entity";

// Schema Model version of findConflictingProperties
export function raiseAttributeAmbiguity(
    properties: Set<string> | Array<string>,
    entityOrRel?: ConcreteEntityAdapter | RelationshipAdapter
): void {
    if (!entityOrRel) {
        return;
    }
    const hash = {};
    properties.forEach((property) => {
        if (isConcreteEntity(entityOrRel) && entityOrRel.relationships.get(property)) {
            return;
        }
        const dbName = entityOrRel.findAttribute(property)?.databaseName;
        if (dbName === undefined) {
            throw new Error(
                `Transpile Error: Impossible to translate property ${property} on entity ${entityOrRel.name}`
            );
        }
        if (hash[dbName]) {
            throw new Neo4jGraphQLError(
                `Conflicting modification of ${[hash[dbName], property].map((n) => `[[${n}]]`).join(", ")} on type ${
                    entityOrRel.name
                }`
            );
        }
        hash[dbName] = property;
    });
}
