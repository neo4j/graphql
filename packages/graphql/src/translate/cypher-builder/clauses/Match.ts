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

import type { CypherEnvironment } from "../Environment";
import type { NodeRef } from "../variables/NodeRef";
import { MatchableElement, MatchParams, Pattern } from "../Pattern";
import { Where, WhereParams } from "../sub-clauses/Where";
import { Clause } from "./Clause";
import { Return } from "./Return";
import { Variable } from "../variables/Variable";
import { ComparisonOp, eq } from "../operations/comparison";
import { PropertyRef } from "../PropertyRef";
import { and, BooleanOp } from "../operations/boolean";
import { SetClause, SetParam } from "../sub-clauses/Set";
import { compileCypherIfExists } from "../utils";

export class Match<T extends MatchableElement = any> extends Clause {
    private pattern: Pattern<T>;
    private whereSubClause: Where | undefined;
    private returnStatement: Return | undefined;
    private setSubClause: SetClause | undefined;

    constructor(variable: T | Pattern<T>, parameters: MatchParams<T> = {}, parent?: Clause) {
        super(parent);
        if (variable instanceof Pattern) {
            this.pattern = variable;
        } else {
            this.pattern = new Pattern(variable).withParams(parameters);
        }
        this.addChildren(this.pattern);
    }

    public where(input: WhereParams): this;
    public where(target: Variable, params: Record<string, Variable>): this;
    public where(input: WhereParams | Variable, params?: Record<string, Variable>): this {
        const whereInput = this.createWhereInput(input, params);
        if (!whereInput) return this;

        if (!this.whereSubClause) {
            const whereClause = new Where(this, whereInput);
            this.whereSubClause = whereClause;
        } else {
            this.and(whereInput);
        }
        return this;
    }

    public and(input: WhereParams): this;
    public and(target: Variable, params: Record<string, Variable>): this;
    public and(input: WhereParams | Variable, params?: Record<string, Variable>): this {
        if (!this.whereSubClause) throw new Error("Cannot and without a where");
        const whereInput = this.createWhereInput(input, params);
        if (whereInput) {
            this.whereSubClause.and(whereInput);
        }
        return this;
    }

    public set(...params: SetParam[]): this {
        if (!this.setSubClause) {
            this.setSubClause = new SetClause(this, params);
        } else {
            this.setSubClause.addParams(...params);
        }
        return this;
    }

    public return(node: NodeRef, fields?: string[], alias?: string): Return {
        const returnStatement = new Return([node, fields, alias]);
        this.addChildren(returnStatement);
        this.returnStatement = returnStatement;
        return returnStatement;
    }

    public getCypher(env: CypherEnvironment): string {
        const nodeCypher = this.pattern.getCypher(env);

        const whereCypher = compileCypherIfExists(this.whereSubClause, env, { prefix: "\n" });
        const returnCypher = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });
        const setCypher = compileCypherIfExists(this.setSubClause, env, { prefix: "\n" });

        return `MATCH ${nodeCypher}${whereCypher}${setCypher}${returnCypher}`;
    }

    private createWhereInput(
        input: WhereParams | Variable,
        params: Record<string, Variable> | undefined
    ): WhereParams | undefined {
        if (input instanceof Variable) {
            const generatedOp = variableAndObjectToOperation(input, params || {});
            return generatedOp;
        }
        return input;
    }
}

/** Transforms a simple input into an operation sub tree */
function variableAndObjectToOperation(
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
