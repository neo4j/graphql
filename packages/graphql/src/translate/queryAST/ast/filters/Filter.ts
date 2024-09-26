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

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../QueryASTContext";
import { QueryASTNode } from "../QueryASTNode";

export type NumericalWhereOperator = "GT" | "GTE" | "LT" | "LTE";
export type SpatialWhereOperator = "DISTANCE";
export type StringWhereOperator = "CONTAINS" | "STARTS_WITH" | "ENDS_WITH";
export type RegexWhereOperator = "MATCHES";
export type ArrayWhereOperator = "IN" | "INCLUDES";
export type RelationshipWhereOperator = "ALL" | "NONE" | "SINGLE" | "SOME";

export type FilterOperator =
    | "EQ"
    | "NOT"
    | NumericalWhereOperator
    | SpatialWhereOperator
    | StringWhereOperator
    | `NOT_${StringWhereOperator}`
    | RegexWhereOperator
    | ArrayWhereOperator
    | `NOT_${ArrayWhereOperator}`
    | RelationshipWhereOperator;

export type LogicalOperators = "NOT" | "AND" | "OR" | "XOR";

const RELATIONSHIP_OPERATORS = ["ALL", "NONE", "SINGLE", "SOME"] as const;

export function isRelationshipOperator(operator: string): operator is RelationshipWhereOperator {
    return RELATIONSHIP_OPERATORS.includes(operator as any);
}

export abstract class Filter extends QueryASTNode {
    public abstract getPredicate(context: QueryASTContext): Cypher.Predicate | undefined;
}
