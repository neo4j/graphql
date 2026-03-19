/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { AggregationOperation } from "../operations/AggregationOperation";
import type { CompositeAggregationOperation } from "../operations/composite/CompositeAggregationOperation";
import { Field } from "./Field";

/** An aggregate field inside connection */
export class ConnectionAggregationField extends Field {
    public operation: AggregationOperation | CompositeAggregationOperation;

    private nodeAlias: string;

    private projectionExpr: Cypher.Expr | undefined;

    constructor({
        operation,
        alias,
        nodeAlias,
    }: {
        operation: AggregationOperation | CompositeAggregationOperation;
        alias: string;
        nodeAlias: string;
    }) {
        super(alias);
        this.operation = operation;
        this.nodeAlias = nodeAlias;
    }

    public getChildren(): QueryASTNode[] {
        return [this.operation];
    }

    public getProjectionField(): Record<string, Cypher.Expr> {
        if (!this.projectionExpr) {
            throw new Error("Projection expression of operation not available (has transpile been called)?");
        }

        return { [this.alias]: this.projectionExpr };
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const subqueryContext = new QueryASTContext({ ...context, returnVariable: new Cypher.Variable() });
        const result = this.operation.transpile(subqueryContext);
        this.projectionExpr = result.projectionExpr;
        return result.clauses;
    }
}
