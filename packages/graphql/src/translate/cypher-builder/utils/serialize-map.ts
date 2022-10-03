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

import type { Expr } from "../CypherBuilder";
import type { CypherEnvironment } from "../Environment";

export function serializeMap(
    env: CypherEnvironment,
    obj: Record<string, Expr | undefined>,
    omitCurlyBraces = false
): string {
    const valuesList = Object.entries(obj)
        .filter(([_k, value]) => value !== undefined)
        .map(([key, value]) => {
            return `${key}: ${(value as Expr).getCypher(env)}`; // TODO: improve Typings
        });

    const serializedContent = valuesList.join(", ");
    if (omitCurlyBraces) return serializedContent;

    return `{ ${serializedContent} }`;
}
