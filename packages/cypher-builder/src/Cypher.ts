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
export { Match, OptionalMatch } from "./clauses/Match";
export { Create } from "./clauses/Create";
export { Merge } from "./clauses/Merge";
export { Call } from "./clauses/Call";
export { CallProcedure } from "./clauses/CallProcedure";
export { Return } from "./clauses/Return";
export { RawCypher } from "./clauses/RawCypher";
export { With } from "./clauses/With";
export { Unwind } from "./clauses/Unwind";
export { Union } from "./clauses/Union";
export { Foreach } from "./clauses/Foreach";

export { concat } from "./clauses/utils/concat";

// Variables and references
export { NodeRef as Node, NamedNode } from "./references/NodeRef";
export { RelationshipRef as Relationship } from "./references/RelationshipRef";
export { Param, NamedParam } from "./references/Param";
export { NamedVariable, Variable } from "./references/Variable";
export { Literal, CypherNull as Null } from "./references/Literal";

// Expressions
export { Exists } from "./expressions/Exists";
export { Case } from "./expressions/Case";

// --Procedures
export * as db from "./procedures/db";

// --Apoc
export * as apoc from "./apoc/apoc";

// --Lists
export { ListComprehension } from "./expressions/list/ListComprehension";
export { PatternComprehension } from "./expressions/list/PatternComprehension";
export { ListExpr as List } from "./expressions/list/ListExpr";

// --Map
export { MapExpr as Map } from "./expressions/map/MapExpr";
export { MapProjection } from "./expressions/map/MapProjection";

// --Operations
export { or, and, not } from "./expressions/operations/boolean";
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
} from "./expressions/operations/comparison";
export { plus, minus } from "./expressions/operations/math";

// --Functions
export { CypherFunction as Function } from "./expressions/functions/CypherFunction";

export {
    coalesce,
    point,
    distance,
    pointDistance,
    cypherDatetime as datetime,
    cypherDate as date,
    cypherLocalTime as localtime,
    cypherLocalDatetime as localdatetime,
    cypherTime as time,
    labels,
    count,
    min,
    max,
    avg,
    sum,
    randomUUID,
} from "./expressions/functions/CypherFunction";

export * from "./expressions/functions/StringFunctions";

export * from "./expressions/functions/ListFunctions";
export { any, all, exists, single } from "./expressions/functions/PredicateFunctions";

// Types
export type { CypherResult } from "./types";
export type { PropertyRef } from "./references/PropertyRef";
export type { Clause } from "./clauses/Clause";
export type { CypherEnvironment as Environment } from "./Environment";
export type { ComparisonOp } from "./expressions/operations/comparison";
export type { BooleanOp } from "./expressions/operations/boolean";
export type { Expr, Predicate, Operation, Procedure } from "./types";
export type { ProjectionColumn } from "./clauses/sub-clauses/Projection";
export type { SetParam } from "./clauses/sub-clauses/Set";
export type { PredicateFunction } from "./expressions/functions/PredicateFunctions";
export type { Order } from "./clauses/sub-clauses/OrderBy";
export type { Pattern } from "./Pattern";
export type { CompositeClause } from "./clauses/utils/concat";

// utils
// --Procedures
export * as utils from "./utils/utils";
