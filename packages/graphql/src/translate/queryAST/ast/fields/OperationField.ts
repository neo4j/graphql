/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { CypherAttributeOperation } from "../operations/CypherAttributeOperation";
import { CypherEntityOperation } from "../operations/CypherEntityOperation";
import { CompositeCypherOperation } from "../operations/composite/CompositeCypherOperation";
import type { Operation } from "../operations/operations";
import { Field } from "./Field";

export class OperationField extends Field {
    public operation: Operation;

    private projectionExpr: Cypher.Expr | undefined;

    constructor({ operation, alias }: { operation: Operation; alias: string }) {
        super(alias);
        this.operation = operation;
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

    public isCypherField(): this is this & {
        operation: CypherEntityOperation | CypherAttributeOperation | CompositeCypherOperation;
    } {
        return (
            this.operation instanceof CypherEntityOperation ||
            this.operation instanceof CypherAttributeOperation ||
            this.operation instanceof CompositeCypherOperation
        );
    }
}
