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

export abstract class MutationOperation extends Operation {
    abstract transpile(context: QueryASTContext): OperationTranspileResult;
}
