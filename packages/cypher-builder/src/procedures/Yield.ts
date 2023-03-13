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
import type { CypherEnvironment } from "../Environment";
import type { Literal } from "../references/Literal";
import type { Variable } from "../references/Variable";
import { NamedVariable } from "../references/Variable";
import type { Expr } from "../types";
import { asArray } from "../utils/as-array";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import type { CypherProcedure } from "./CypherProcedure";

export type YieldProjectionColumn<T extends string> = T | [T, Variable | Literal];

export interface Yield extends WithReturn, WithWhere {}

/** Cypher Procedure yield projection
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/call/#call-call-a-procedure-call-yield-star)
 * @group Expressions
 * @category Procedures
 */
@mixin(WithReturn, WithWhere)
export class Yield extends Clause {
    private cypherProcedure: CypherProcedure<any>;
    private projection: YieldProjection;

    constructor(call: CypherProcedure<any>, yieldColumns: Array<"*" | YieldProjectionColumn<any>>) {
        super();
        this.cypherProcedure = call;

        const columns = asArray<YieldProjectionColumn<any> | "*">(yieldColumns);
        this.projection = new YieldProjection(columns);
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

export class YieldProjection extends Projection {
    constructor(columns: Array<"*" | YieldProjectionColumn<string>>) {
        super([]);
        const parsedColumns = columns.map((c) => this.parseYieldColumn(c));
        this.addColumns(parsedColumns);
    }

    private parseYieldColumn(input: "*" | YieldProjectionColumn<string>): "*" | ProjectionColumn {
        if (input === "*") return input;
        if (typeof input === "string") return this.createVariableForStrings(input);
        if (Array.isArray(input)) {
            return [this.createVariableForStrings(input[0]), input[1]];
        }
        return input;
    }

    private createVariableForStrings(rawVar: Expr | string | Variable | Literal): Expr {
        if (typeof rawVar === "string") return new NamedVariable(rawVar);
        return rawVar;
    }
}
