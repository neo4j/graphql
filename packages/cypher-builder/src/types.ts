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

import type { PropertyRef } from "./references/PropertyRef";
import type { CypherFunction } from "./expressions/functions/CypherFunctions";
import type { Literal } from "./references/Literal";
import type { Exists } from "./expressions/Exists";
import type { CypherEnvironment } from "./Environment";
import type { MapExpr } from "./expressions/map/MapExpr";
import type { BooleanOp } from "./expressions/operations/boolean";
import type { ComparisonOp } from "./expressions/operations/comparison";
import type { RawCypher } from "./clauses/RawCypher";
import type { PredicateFunction } from "./expressions/functions/PredicateFunctions";
import type { Case } from "./expressions/Case";
import type { MathOp } from "./expressions/operations/math";
import type { ListComprehension } from "./expressions/list/ListComprehension";
import type { PatternComprehension } from "./expressions/list/PatternComprehension";
import type { ListExpr } from "./expressions/list/ListExpr";
import type { MapProjection } from "./expressions/map/MapProjection";
import type { HasLabel } from "./expressions/HasLabel";
import type { Reference } from "./references/Reference";
import type { ApocFunction, ApocPredicate } from "./apoc/types";
import type { ListIndex } from "./expressions/list/ListIndex";
import type { Path } from "./references/Path";
import type { CypherProcedure } from "./procedures/CypherProcedure";

export type Operation = BooleanOp | ComparisonOp | MathOp;

/** Represents a Cypher Expression
 *  @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/expressions/)
 */
export type Expr =
    | Operation
    | Reference
    | Literal
    | PropertyRef
    | CypherFunction
    | Predicate
    | ListComprehension
    | PatternComprehension
    | MapExpr // NOTE this cannot be set as a property in a node
    | MapProjection // NOTE this cannot be set as a property in a node
    | ListExpr
    | ListIndex
    | ApocFunction
    | Case<ComparisonOp>
    | Path;

/** Represents a predicate statement (i.e returns a boolean). Note that RawCypher is only added for compatibility */
export type Predicate =
    | BooleanOp
    | ComparisonOp
    | RawCypher
    | Exists
    | PredicateFunction
    | ApocPredicate
    | Literal<boolean>
    | Case
    | HasLabel;

export type CypherResult = {
    cypher: string;
    params: Record<string, string>;
};

/** Defines the interface for a class that can be compiled into Cypher */
export interface CypherCompilable {
    getCypher(env: CypherEnvironment): string;
}
