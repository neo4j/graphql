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

import type { ListExpr as List } from "../expressions/list/ListExpr";
import type { MapExpr as Map } from "../expressions/map/MapExpr";
import { Literal } from "../references/Literal";
import { normalizeVariable } from "../utils/normalize-variable";
import { VoidCypherProcedure } from "../procedures/CypherProcedure";
import { CypherFunction } from "../expressions/functions/CypherFunctions";
import type { Predicate } from "../types";

/**
 * @group Expressions
 * @category Procedures
 */
export function validate(
    predicate: Predicate,
    message: string | Literal<string>,
    params: List | Literal | Map = new Literal([0])
): VoidCypherProcedure {
    const messageVar = normalizeVariable(message);
    return new VoidCypherProcedure("apoc.util.validate", [predicate, messageVar, params]);
}

/**
 * @group Expressions
 * @category Functions
 */
export function validatePredicate(predicate: Predicate, message: string): CypherFunction {
    const defaultParam = new Literal([0]);

    return new CypherFunction("apoc.util.validatePredicate", [predicate, new Literal(message), defaultParam]);
}
