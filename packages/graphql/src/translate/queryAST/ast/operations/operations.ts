/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
