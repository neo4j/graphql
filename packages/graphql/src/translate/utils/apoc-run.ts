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

import { stringifyObject } from "./stringify-object";
import Cypher from "@neo4j/cypher-builder";

/** Wraps a query inside an apoc call, escaping strings and serializing params */
export function wrapInApocRunFirstColumn(
    query: Cypher.RawCypher,
    params: Record<string, string> = {},
    expectMultipleValues?: boolean
): Cypher.RawCypher {
    const serializedParams = stringifyObject(params);

    if (expectMultipleValues === false) {
        return new Cypher.RawCypher((env) => `apoc.cypher.runFirstColumnSingle("${query.getCypher(env)}", ${serializedParams.getCypher(env)})`);
    }

    return new Cypher.RawCypher(
        (env) => `apoc.cypher.runFirstColumnMany("${query.getCypher(env)}", ${serializedParams.getCypher(env)})`
    );
}

export function serializeParamsForApocRun(params: Record<string, any>): Record<string, string> {
    return Object.keys(params).reduce((acc, key) => {
        acc[key] = `$${key}`;
        return acc;
    }, {});
}
