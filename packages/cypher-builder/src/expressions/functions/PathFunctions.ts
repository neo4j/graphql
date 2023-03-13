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

import type { Path } from "../../Cypher";
import { CypherFunction } from "./CypherFunctions";

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-cheat-sheet/current/#_path_functions)
 * @group Expressions
 * @category Cypher Functions
 */
export function nodes(expr: Path): CypherFunction {
    return new CypherFunction("nodes", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-cheat-sheet/current/#_path_functions)
 * @group Expressions
 * @category Cypher Functions
 */
export function relationships(expr: Path): CypherFunction {
    return new CypherFunction("relationships", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-cheat-sheet/current/#_path_functions)
 * @group Expressions
 * @category Cypher Functions
 */
export function length(expr: Path): CypherFunction {
    return new CypherFunction("length", [expr]);
}
