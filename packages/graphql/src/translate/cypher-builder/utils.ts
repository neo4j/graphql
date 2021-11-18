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

import { CypherStatement, CypherParams } from "../types";
import { stringifyObject } from "../utils/stringify-object";

/** Generates a string to be used as parameter key */
export function generateParameterKey(prefix: string, key: string): string {
    return `${prefix}_${key}`;
}

/** Serializes an object and splits between the serialized statement and params */
export function serializeParameters(keyprefix: string, parameters: CypherParams | undefined): CypherStatement {
    if (!parameters) return ["", {}];

    const cypherParameters: CypherParams = {};
    const nodeParameters: Record<string, string> = {};

    for (const [key, value] of Object.entries(parameters)) {
        const paramKey = generateParameterKey(keyprefix, key);
        cypherParameters[paramKey] = value;
        nodeParameters[key] = `$${paramKey}`;
    }

    return [stringifyObject(nodeParameters), cypherParameters];
}

/** Adds spaces to the left of the string, returns empty string is variable is undefined or empty string */
export function padLeft(str: string | undefined): string {
    if (!str) return "";
    return ` ${str}`;
}
