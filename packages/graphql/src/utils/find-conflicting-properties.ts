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

import type { Node } from "../classes";
import mapToDbProperty from "./map-to-db-property";

/* returns conflicting mutation input properties */
export function findConflictingProperties({
    node,
    input,
}: {
    node: Node;
    input: Record<string, any> | undefined;
}): string[] {
    if (!input) {
        return [];
    }
    const dbPropertiesToInputFieldNames: Record<string, string[]> = Object.keys(input).reduce((acc, fieldName) => {
        const dbName = mapToDbProperty(node, fieldName);
        // some input fields (eg relation fields) have no corresponding db name in the map
        if (!dbName) {
            return acc;
        }
        if (acc[dbName]) {
            acc[dbName].push(fieldName);
        } else {
            acc[dbName] = [fieldName];
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
