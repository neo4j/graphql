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

import { ClauseMixin } from "./ClauseMixin";
import { Where, WhereParams } from "../../sub-clauses/Where";
import { Variable } from "../../variables/Variable";
import { and, BooleanOp } from "../../operations/boolean";
import { PropertyRef } from "../../PropertyRef";
import { ComparisonOp, eq } from "../../operations/comparison";

export abstract class WithWhere extends ClauseMixin {
    protected whereSubClause: Where | undefined;

    public where(input: WhereParams): this;
    public where(target: Variable, params: Record<string, Variable>): this;
    public where(input: WhereParams | Variable, params?: Record<string, Variable>): this {
        this.updateOrCreateWhereClause(input, params);
        return this;
    }

    public and(input: WhereParams): this;
    public and(target: Variable, params: Record<string, Variable>): this;
    public and(input: WhereParams | Variable, params?: Record<string, Variable>): this {
        this.updateOrCreateWhereClause(input, params);
        return this;
    }

    private updateOrCreateWhereClause(input: WhereParams | Variable, params?: Record<string, Variable>): void {
        const whereInput = this.createWhereInput(input, params);
        if (!whereInput) return;

        if (!this.whereSubClause) {
            const whereClause = new Where(this, whereInput);
            this.whereSubClause = whereClause;
        } else {
            this.whereSubClause.and(whereInput);
        }
    }

    private createWhereInput(
        input: WhereParams | Variable,
        params: Record<string, Variable> | undefined
    ): WhereParams | undefined {
        if (input instanceof Variable) {
            const generatedOp = this.variableAndObjectToOperation(input, params || {});
            return generatedOp;
        }
        return input;
    }

    /** Transforms a simple input into an operation sub tree */
    private variableAndObjectToOperation(
        target: Variable,
        params: Record<string, Variable>
    ): BooleanOp | ComparisonOp | undefined {
        let operation: BooleanOp | ComparisonOp | undefined;
        for (const [key, value] of Object.entries(params)) {
            const property = new PropertyRef(target, key);
            const eqOp = eq(property, value);
            if (!operation) operation = eqOp;
            else {
                operation = and(operation, eqOp);
            }
        }
        return operation;
    }
}
