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

import type { CypherEnvironment } from "../Environment";
import type { CypherCompilable } from "../types";

/** Compiles the cypher of an element, if the resulting cypher is not empty adds a prefix */
export function compileCypherIfExists(
    element: CypherCompilable | undefined,
    env: CypherEnvironment,
    { prefix = "", suffix = "" }: { prefix?: string; suffix?: string } = {}
): string {
    if (!element) return "";
    const cypher = element.getCypher(env);
    if (!cypher) return "";
    return `${prefix}${cypher}${suffix}`;
}
