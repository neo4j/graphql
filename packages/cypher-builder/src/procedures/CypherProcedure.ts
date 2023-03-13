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

import { Clause } from "../clauses/Clause";
import { WithReturn } from "../clauses/mixins/WithReturn";
import { WithWhere } from "../clauses/mixins/WithWhere";
import type { ProjectionColumn } from "../clauses/sub-clauses/Projection";
import { Projection } from "../clauses/sub-clauses/Projection";
import { mixin } from "../clauses/utils/mixin";
import { CypherASTNode } from "../CypherASTNode";
import type { CypherEnvironment } from "../Environment";
import type { Expr } from "../types";
import { asArray } from "../utils/as-array";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";

/** Represents a Cypher Function
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/)
 * @group Expressions
 * @category Cypher Functions
 */
export class CypherProcedure extends Clause {
    protected name: string;
    private params: Array<Expr>;

    constructor(name: string, params: Array<Expr> = []) {
        super();
        this.name = name;
        this.params = params;
        for (const param of params) {
            if (param instanceof CypherASTNode) {
                this.addChildren(param);
            }
        }
    }

    public yield(...columns: Array<"*" | ProjectionColumn>): CypherProcedureYield {
        if (columns.length === 0) throw new Error("Empty projection in CALL ... YIELD");
        return new CypherProcedureYield(this, columns);
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const procedureCypher = this.getProcedureCypher(env);
        return `CALL ${procedureCypher}`;
    }

    private getProcedureCypher(env: CypherEnvironment): string {
        const argsStr = this.params.map((expr) => expr.getCypher(env)).join(", ");

        return `${this.name}(${argsStr})`;
    }
}

export interface CypherProcedureYield extends WithReturn, WithWhere {}

@mixin(WithReturn, WithWhere)
export class CypherProcedureYield extends Clause {
    private cypherProcedure: CypherProcedure;
    private projection: Projection;

    constructor(call: CypherProcedure, yieldColumns: Array<"*" | ProjectionColumn>) {
        super();
        this.cypherProcedure = call;

        const columns = asArray<ProjectionColumn | "*">(yieldColumns);
        this.projection = new Projection(columns);
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const callProcedureStr = this.cypherProcedure.getCypher(env);
        const yieldProjectionStr = this.projection.getCypher(env);

        const whereStr = compileCypherIfExists(this.whereSubClause, env, {
            prefix: "\n",
        });
        const returnStr = compileCypherIfExists(this.returnStatement, env, {
            prefix: "\n",
        });

        return `${callProcedureStr} YIELD ${yieldProjectionStr}${whereStr}${returnStr}`;
    }
}
