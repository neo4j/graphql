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
import { CypherFunction } from "./CypherFunctions";

function dateFunction(name: string, timezone?: Expr): CypherFunction {
    return new CypherFunction(name, timezone ? [timezone] : undefined);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/temporal/#functions-datetime)
 * @group Expressions
 * @category Cypher Functions
 */
export function cypherDatetime(timezone?: Expr): CypherFunction {
    return dateFunction("datetime", timezone);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/temporal/#functions-date)
 * @group Expressions
 * @category Cypher Functions
 * @example
 *
 * Using date without parameters:
 *
 * ```ts
 * Cypher.Date()
 * ```
 *
 * _Cypher:_
 * ```cypher
 * date()
 * ```
 *
 * ---
 *
 * Date with parameters:
 *
 * ```ts
 * Cypher.Date(new Cypher.param('9999-01-01'))
 * ```
 *
 * _Cypher:_
 * ```cypher
 * date($param1)
 * ```
 *
 * _Params:_
 * ```json
 * {
 *   param1: "9999-01-01"
 * }
 * ```
 *
 *
 */
export function cypherDate(timezone?: Expr): CypherFunction {
    return dateFunction("date", timezone);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/temporal/#functions-localdatetime)
 * @group Expressions
 * @category Cypher Functions
 */
export function cypherLocalDatetime(timezone?: Expr): CypherFunction {
    return dateFunction("localdatetime", timezone);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/temporal/#functions-localdatetime)
 * @group Expressions
 * @category Cypher Functions
 */
export function cypherLocalTime(timezone?: Expr): CypherFunction {
    return dateFunction("localtime", timezone);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/temporal/#functions-time)
 * @group Expressions
 * @category Cypher Functions
 */
export function cypherTime(timezone?: Expr): CypherFunction {
    return dateFunction("time", timezone);
}
