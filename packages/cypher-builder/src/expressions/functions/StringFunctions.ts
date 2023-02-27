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

import type { Expr } from "../../types";
import { filterTruthy } from "../../utils/filter-truthy";

import { CypherFunction } from "./CypherFunctions";

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function left(original: Expr, length: Expr): CypherFunction {
    return new CypherFunction("left", [original, length]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function lTrim(original: Expr): CypherFunction {
    return new CypherFunction("lTrim", [original]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function replace(original: Expr, search: Expr, replace: Expr): CypherFunction {
    return new CypherFunction("replace", [original, search, replace]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function reverse(original: Expr): CypherFunction {
    return new CypherFunction("reverse", [original]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function right(original: Expr, length: Expr): CypherFunction {
    return new CypherFunction("right", [original, length]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function rTrim(original: Expr): CypherFunction {
    return new CypherFunction("rTrim", [original]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function split(original: Expr, delimiter: Expr): CypherFunction {
    return new CypherFunction("split", [original, delimiter]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function substring(original: Expr, start: Expr, length?: Expr): CypherFunction {
    return new CypherFunction("substring", filterTruthy([original, start, length]));
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function toLower(original: Expr): CypherFunction {
    return new CypherFunction("toLower", [original]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function toString(expression: Expr): CypherFunction {
    return new CypherFunction("toString", [expression]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function toStringOrNull(expression: Expr): CypherFunction {
    return new CypherFunction("toStringOrNull", [expression]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function toUpper(original: Expr): CypherFunction {
    return new CypherFunction("toUpper", [original]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/string/)
 * @group Expressions
 * @category Cypher Functions
 */
export function trim(original: Expr): CypherFunction {
    return new CypherFunction("trim", [original]);
}
