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

/** Returns true if all properties in obj1 exists in obj2, false otherwise */
export function compareProperties<T>(obj1: Record<string, T>, obj2: Record<string, T>): boolean {
    for (const [k, value] of Object.entries(obj1)) {
        if (obj2[k] !== value) {
            return false;
        }
    }
    return true;
}
