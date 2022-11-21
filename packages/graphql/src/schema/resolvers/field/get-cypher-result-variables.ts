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

import type { Executor } from "../../../classes/Executor";
import { unescapeQuery } from "../../../translate/utils/escape-query";

export async function getCypherResultVariables(statement: string, executor: Executor): Promise<string[]> {
    const explainStatement = wrapInExplain(statement);
    const result = await executor.execute(explainStatement, {}, "READ"); // TODO: WRITE in mutations
    if (!result.summary.plan) throw new Error("Failed to get the plan of @cypher");
    return result.summary.plan.identifiers.filter((v) => !variableIsLiteralValue(v));
}

function wrapInExplain(statement: string): string {
    return `EXPLAIN ${unescapeQuery(statement)}`;
}

/** Checks if a returned variable is a literal value (e.g. RETURN "hello") */
function variableIsLiteralValue(value: string): boolean {
    return value[0] === "`";
}
