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

import type { CypherEnvironment } from "../../Environment";
import type { Variable } from "../../references/Variable";
import type { CypherCompilable } from "../../types";
import type { ListExpr } from "./ListExpr";

/** Access individual elements in the list
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/lists/)
 * @group Expressions
 * @hidden
 * @example
 * ```ts
 * const list = new Cypher.List([new Cypher.Literal("1"), new Cypher.Literal("2"), new Cypher.Literal("3")]);
 * const listIndex = new ListIndex(list, 0);
 * ```
 * Translates to
 * ```cypher
 * [ "1", "2", "3" ][0]
 * ```
 */
export class ListIndex implements CypherCompilable {
    private value: Variable | ListExpr;
    private index: number;

    /**
     * @hidden
     */
    constructor(variable: Variable | ListExpr, index: number) {
        this.value = variable;
        this.index = index;
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        return `${this.value.getCypher(env)}[${this.index}]`;
    }
}
