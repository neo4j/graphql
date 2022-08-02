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

// Clauses
export { Match } from "./clauses/Match";
export { Create } from "./clauses/Create";
export { Merge } from "./clauses/Merge";
export { Call } from "./clauses/Call";
export { Return } from "./clauses/Return";
export { RawCypher } from "./clauses/RawCypher";
export { With } from "./clauses/With";
export { Unwind } from "./clauses/Unwind";

// Clauses-like things
export { Exists } from "./Exists";
export { concat } from "./clauses/utils/concat";
export * as db from "./clauses/procedures/db";

// Variables and references
export { NodeRef as Node, NamedNode } from "./variables/NodeRef";
export { RelationshipRef as Relationship } from "./variables/RelationshipRef";
export { Param, RawParam } from "./variables/Param";
export { NamedVariable, Variable } from "./variables/Variable";
export { CypherNull as Null } from "./variables/Null";
export { Literal } from "./variables/Literal";

// Lists
export { ListComprehension } from "./list/ListComprehension";
export { PatternComprehension } from "./list/PatternComprehension";

// Map
export { MapExpr as Map } from "./map/MapExpr";

export { Pattern } from "./Pattern"; // TODO: Maybe this should not be exported

// Operations
export { or, and, not } from "./operations/boolean";
export {
    eq,
    gt,
    gte,
    lt,
    lte,
    isNull,
    isNotNull,
    inOp as in,
    contains,
    startsWith,
    endsWith,
    matches,
} from "./operations/comparison";
export { plus, minus } from "./operations/math";

// Functions
export {
    coalesce,
    point,
    distance,
    cypherDatetime as datetime,
    labels,
    size,
    count,
    min,
    max,
} from "./functions/CypherFunction";

// Types
export type { CypherResult } from "./types";
export type { PropertyRef } from "./PropertyRef";
export type { Clause } from "./clauses/Clause";
export type { CypherEnvironment as Environment } from "./Environment";
export type { Operation } from "./operations/Operation";
export type { ComparisonOp } from "./operations/comparison";
export type { BooleanOp } from "./operations/boolean";
export type { WhereParams } from "./sub-clauses/Where";
export type { Expr } from "./types";
export type { CypherFunction as Function } from "./functions/CypherFunction";
export type { ComprehensionExpr } from "./list/ComprehensionExpr";
export type { ProjectionColumn } from "./sub-clauses/Projection";
