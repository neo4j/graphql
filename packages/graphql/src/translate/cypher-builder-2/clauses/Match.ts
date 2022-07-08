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
import type { Param } from "../variables/Param";
import type { NodeRef } from "../variables/NodeRef";
import { MatchableElement, MatchParams, Pattern } from "../Pattern";
import { Where, WhereParams } from "../sub-clauses/Where";
import { Clause } from "./Clause";
import { Return } from "./Return";
import { Variable } from "../variables/Variable";
import { ComparisonOp, eq } from "../operations/comparison";
import { PropertyRef } from "../PropertyRef";
import { and, BooleanOp } from "../operations/boolean";

export class Match<T extends MatchableElement> extends Clause {
    private pattern: Pattern<T>;
    private whereSubClause: Where | undefined;
    private returnStatement: Return | undefined;

    constructor(variable: T, parameters: MatchParams<T> = {}, parent?: Clause) {
        super(parent);
        this.pattern = new Pattern(variable).withParams(parameters);
        this.addChildren(this.pattern);
    }

    public where(input: WhereParams): this;
    public where(target: Variable, params: Record<string, Param>): this;
    public where(input: WhereParams | Variable, params?: Record<string, Param>): this {
        let whereInput: WhereParams;
        if (input instanceof Variable) {
            const generatedOp = variableAndObjectToOperation(input, params || {});
            if (!generatedOp) return this;
            whereInput = generatedOp;
        } else {
            whereInput = input;
        }

        if (!this.whereSubClause) {
            const whereClause = new Where(this, whereInput);
            this.addChildren(whereClause);
            // this.addASTNode(whereClause);
            this.whereSubClause = whereClause;
        } else {
            this.and(whereInput);
        }
        return this;
    }

    public and(input: WhereParams): this {
        if (!this.whereSubClause) throw new Error("Cannot and without a where");
        this.whereSubClause.and(input);
        return this;
    }

    public cypher(env: CypherEnvironment): string {
        const nodeCypher = this.pattern.getCypher(env);
        let whereCypher = "";
        let returnCypher = "";
        if (this.whereSubClause) {
            whereCypher = `\n${this.whereSubClause.getCypher(env)}`;
        }
        if (this.returnStatement) {
            returnCypher = `\n${this.returnStatement.getCypher(env)}`;
        }
        return `MATCH ${nodeCypher}${whereCypher}${returnCypher}`;
    }

    public return(node: NodeRef, fields?: string[], alias?: string): Return {
        const returnStatement = new Return([node, fields, alias]);
        this.addChildren(returnStatement);
        this.returnStatement = returnStatement;
        return returnStatement;
    }
}

/** Transforms a simple input into an operation sub tree */
function variableAndObjectToOperation(
    target: Variable,
    params: Record<string, Param>
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
