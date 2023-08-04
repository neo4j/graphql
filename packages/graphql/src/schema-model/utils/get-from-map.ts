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

/**
 * Utility function to ensure that the key exists in the map and avoid unnecessary type casting.
 * Get the value from a map, if the key does not exist throw an error.
 *
 * */
export function getFromMap<K extends keyof any, V>(map: Map<K, V>, key: K): V {
    const item = map.get(key);
    if (item === undefined) {
        throw new Error(`Key "${String(key)}" does not exist in the map.`);
    }
    return item;
}
