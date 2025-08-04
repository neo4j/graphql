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

export type OperationTranspileResult = {
    projectionExpr: Cypher.Expr;
    clauses: Cypher.Clause[];
    extraProjectionColumns?: Array<[Cypher.Expr, Cypher.Variable]>; // This embeds extra columns in the last return, used as a hack for fulltext score
};

export abstract class Operation extends QueryASTNode {
    abstract transpile(context: QueryASTContext): OperationTranspileResult;
}

/** This represent an atomic mutation operation (CREATE, DELETE, UPDATE)
 * It is not the same as an Operation (as above) because it does not return a projection
 */
export abstract class MutationOperation extends QueryASTNode {
    abstract transpile(context: QueryASTContext): OperationTranspileResult;

    /** Used for "AFTER" Auth subqueries, BEFORE subqueries should be part of transpile */
    abstract getAuthorizationSubqueries(context: QueryASTContext): Cypher.Clause[];
}
