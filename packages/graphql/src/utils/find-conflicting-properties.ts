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

import type { GraphElement } from "../classes";
import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import { parseMutationField } from "../translate/queryAST/factory/parsers/parse-mutation-field";
import mapToDbProperty from "./map-to-db-property";

/** returns conflicting mutation input properties
 * @deprecated
 */
export function findConflictingProperties({
    graphElement,
    input,
}: {
    graphElement: GraphElement;
    input: Record<string, any> | undefined;
}): string[] {
    if (!input) {
        return [];
    }
    const dbPropertiesToInputFieldNames: Record<string, string[]> = Object.keys(input).reduce((acc, rawField) => {
        const { fieldName } = parseMutationField(rawField);

        const dbName = mapToDbProperty(graphElement, fieldName);
        // some input fields (eg relation fields) have no corresponding db name in the map
        if (!dbName) {
            return acc;
        }
        if (acc[dbName]) {
            acc[dbName].push(rawField);
        } else {
            acc[dbName] = [rawField];
        }
        return acc;
    }, {});

    return Object.values(dbPropertiesToInputFieldNames)
        .filter((v) => v.length > 1)
        .reduce((acc, el) => {
            acc.push(...el);
            return acc;
        }, []);
}

export function findConflictingAttributes(
    fields: string[],
    entityOrRel: ConcreteEntityAdapter | RelationshipAdapter
): Set<string> {
    const fieldsByDbName = new Map<string, string[]>();

    for (const rawField of fields) {
        const { fieldName } = parseMutationField(rawField);
        const dbName = entityOrRel.findAttribute(fieldName)?.databaseName;
        if (dbName) {
            const fields = fieldsByDbName.get(dbName) ?? [];
            fields.push(rawField);
            fieldsByDbName.set(dbName, fields);
        }
    }

    const conflictingAttributes = new Set<string>();
    for (const dedupedProps of fieldsByDbName.values()) {
        if (dedupedProps.length > 1) {
            for (const fieldName of dedupedProps) {
                conflictingAttributes.add(fieldName);
            }
        }
    }
    return conflictingAttributes;
}
