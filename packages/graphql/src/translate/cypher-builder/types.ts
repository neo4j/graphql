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

import type { Variable } from "./variables/Variable";
import type { Operation } from "./expressions/operations/Operation";
import type { PropertyRef } from "./expressions/PropertyRef";
import type { CypherFunction } from "./expressions/functions/CypherFunction";
import type { Literal } from "./variables/Literal";
import type { Exists } from "./expressions/Exists";
import type { CypherEnvironment } from "./Environment";
import type { ComprehensionExpr } from "./expressions/list/ComprehensionExpr";
import type { MapExpr } from "./expressions/map/MapExpr";
import type { BooleanOp } from "./expressions/operations/boolean";
import type { ComparisonOp } from "./expressions/operations/comparison";
import type { RawCypher } from "./clauses/RawCypher";
import type { PredicateFunction } from "./expressions/functions/PredicateFunctions";
import type { ValidatePredicate } from "./expressions/procedures/apoc/apoc";

export type Expr =
    | Operation
    | Variable
    | PropertyRef
    | CypherFunction
    | Literal
    | Predicate
    | ComprehensionExpr
    | MapExpr;

/** Represents a predicate statement (i.e returns a boolean). Note that RawCypher is only added for compatibility */
export type Predicate =
    | BooleanOp
    | ComparisonOp
    | RawCypher
    | Exists
    | PredicateFunction
    | ValidatePredicate
    | Literal<boolean>;

export type CypherResult = {
    cypher: string;
    params: Record<string, string>;
};

/** Defines the interface for a class that can be compiled into Cypher */
export interface CypherCompilable {
    getCypher(env: CypherEnvironment): string;
}
