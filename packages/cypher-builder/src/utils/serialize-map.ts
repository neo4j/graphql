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

import type { Expr } from "../types";
import type { CypherEnvironment } from "../Environment";
import { escapeProperty } from "./escape";

export function serializeMap(env: CypherEnvironment, map: Map<string, Expr>, omitCurlyBraces = false): string {
    const serializedFields: string[] = [];

    for (const [key, value] of map.entries()) {
        if (value) {
            const fieldStr = `${escapeProperty(key)}: ${value.getCypher(env)}`;
            serializedFields.push(fieldStr);
        }
    }

    const serializedContent = serializedFields.join(", ");
    if (omitCurlyBraces) return serializedContent;
    return `{ ${serializedContent} }`;
}
