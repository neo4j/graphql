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
import { Where } from "../sub-clauses/Where";
import type { BooleanOp } from "../../expressions/operations/boolean";
import { and } from "../../expressions/operations/boolean";
import { PropertyRef } from "../../references/PropertyRef";
import type { ComparisonOp } from "../../expressions/operations/comparison";
import { eq } from "../../expressions/operations/comparison";
import type { Predicate } from "../../types";
import { Reference } from "../../references/Reference";
import type { RelationshipRef } from "../../references/RelationshipRef";
import type { NodeRef } from "../../references/NodeRef";
import type { Variable } from "../../references/Variable";
import type { Literal } from "../../references/Literal";

export type VariableLike = Reference | Literal | PropertyRef;
type VariableWithProperties = Variable | NodeRef | RelationshipRef | PropertyRef;

export abstract class WithWhere extends ClauseMixin {
    protected whereSubClause: Where | undefined;

    public where(input: Predicate): this;
    public where(target: VariableWithProperties, params: Record<string, VariableLike>): this;
    public where(input: Predicate | VariableWithProperties, params?: Record<string, VariableLike>): this {
        this.updateOrCreateWhereClause(input, params);
        return this;
    }

    public and(input: Predicate): this;
    public and(target: VariableWithProperties, params: Record<string, VariableLike>): this;
    public and(input: Predicate | VariableWithProperties, params?: Record<string, VariableLike>): this {
        this.updateOrCreateWhereClause(input, params);
        return this;
    }

    private updateOrCreateWhereClause(
        input: Predicate | VariableWithProperties,
        params?: Record<string, VariableLike>
    ): void {
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
        input: Predicate | Reference | PropertyRef,
        params: Record<string, VariableLike> | undefined
    ): Predicate | undefined {
        if (input instanceof Reference || input instanceof PropertyRef) {
            const generatedOp = this.variableAndObjectToOperation(input, params || {});
            return generatedOp;
        }
        return input;
    }

    /** Transforms a simple input into an operation sub tree */
    private variableAndObjectToOperation(
        target: Reference | PropertyRef,
        params: Record<string, VariableLike>
    ): BooleanOp | ComparisonOp | undefined {
        let operation: BooleanOp | ComparisonOp | undefined;
        for (const [key, value] of Object.entries(params)) {
            const property = target.property(key);
            const eqOp = eq(property, value);
            if (!operation) operation = eqOp;
            else {
                operation = and(operation, eqOp);
            }
        }
        return operation;
    }
}
