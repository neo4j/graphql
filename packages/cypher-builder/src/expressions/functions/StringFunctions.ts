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

import { CypherFunction } from "./CypherFunction";

export function left(original: Expr, length: Expr): CypherFunction {
    return new CypherFunction("left", [original, length]);
}

export function lTrim(original: Expr): CypherFunction {
    return new CypherFunction("lTrim", [original]);
}

export function replace(original: Expr, search: Expr, replace: Expr): CypherFunction {
    return new CypherFunction("replace", [original, search, replace]);
}

export function reverse(original: Expr): CypherFunction {
    return new CypherFunction("reverse", [original]);
}

export function right(original: Expr, length: Expr): CypherFunction {
    return new CypherFunction("right", [original, length]);
}

export function rTrim(original: Expr): CypherFunction {
    return new CypherFunction("rTrim", [original]);
}

export function split(original: Expr, delimiter: Expr): CypherFunction {
    return new CypherFunction("split", [original, delimiter]);
}

export function substring(original: Expr, start: Expr, length?: Expr): CypherFunction {
    return new CypherFunction("substring", filterTruthy([original, start, length]));
}

export function toLower(original: Expr): CypherFunction {
    return new CypherFunction("toLower", [original]);
}

export function toString(expression: Expr): CypherFunction {
    return new CypherFunction("toString", [expression]);
}

export function toStringOrNull(expression: Expr): CypherFunction {
    return new CypherFunction("toStringOrNull", [expression]);
}

export function toUpper(original: Expr): CypherFunction {
    return new CypherFunction("toUpper", [original]);
}

export function trim(original: Expr): CypherFunction {
    return new CypherFunction("trim", [original]);
}
