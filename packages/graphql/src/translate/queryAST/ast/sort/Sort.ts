/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../QueryASTContext";
import { QueryASTNode } from "../QueryASTNode";

export type SortField = [Cypher.Expr, Cypher.Order] | [Cypher.Expr];

export abstract class Sort extends QueryASTNode {
    public abstract getSortFields(
        context: QueryASTContext,
        variable: Cypher.Variable | Cypher.Property,
        aliased?: boolean
    ): SortField[];
    public abstract getProjectionField(context: QueryASTContext): string | Record<string, Cypher.Expr>;

    public getSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        return [];
    }
}
