/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { SortField } from "./Sort";
import { Sort } from "./Sort";

export class ScoreSort extends Sort {
    private direction: Cypher.Order;
    private scoreVariable: Cypher.Variable;

    constructor({ scoreVariable, direction }: { scoreVariable: Cypher.Variable; direction: Cypher.Order }) {
        super();
        this.scoreVariable = scoreVariable;
        this.direction = direction;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getSortFields(_context: QueryASTContext, _variable: Cypher.Variable | Cypher.Property): SortField[] {
        return [[this.scoreVariable, this.direction]];
    }

    public getProjectionField(_context: QueryASTContext): string | Record<string, Cypher.Expr> {
        return {};
    }
}
