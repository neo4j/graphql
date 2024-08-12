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

import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { FactoryParseError } from "../factory-parse-error";
import type { GraphQLTreeCreateInput } from "../resolve-tree-parser/graphql-tree/graphql-tree";

export function raiseOnConflictingInput(
    input: GraphQLTreeCreateInput, // TODO: add Update types as well
    entityOrRel: ConcreteEntity | Relationship
): void {
    const hash = {};
    const properties = Object.keys(input);
    properties.forEach((property) => {
        const dbName = entityOrRel.findAttribute(property)?.databaseName;
        if (dbName === undefined) {
            throw new FactoryParseError(`Impossible to translate property ${property} on entity ${entityOrRel.name}`);
        }
        if (hash[dbName]) {
            throw new FactoryParseError(
                `Conflicting modification of ${[hash[dbName], property].map((n) => `[[${n}]]`).join(", ")} on type ${
                    entityOrRel.name
                }`
            );
        }
        hash[dbName] = property;
    });
}
