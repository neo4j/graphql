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

import Cypher from "@neo4j/cypher-builder";
import { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { CypherOperation } from "../operations/CypherOperation";
import { CypherScalarOperation } from "../operations/CypherScalarOperation";
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

    public isCypherField(): boolean {
        return this.operation instanceof CypherOperation || this.operation instanceof CypherScalarOperation;
    }
}
