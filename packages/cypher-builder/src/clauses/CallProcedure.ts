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
import { Clause } from "./Clause";
import type { Procedure } from "../types";
import { asArray } from "../utils/as-array";
import { WithReturn } from "./mixins/WithReturn";
import { WithWhere } from "./mixins/WithWhere";
import { mixin } from "./utils/mixin";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import type { ProjectionColumn } from "./sub-clauses/Projection";
import { Projection } from "./sub-clauses/Projection";

// TODO: ADD yield, where and return
/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/call/)
 * @group Clauses
 */
export class CallProcedure extends Clause {
    private procedure: Procedure;

    constructor(procedure: Procedure) {
        super();
        this.procedure = procedure;
    }

    public yield(...columns: Array<"*" | ProjectionColumn>): CallProcedureYield {
        if (columns.length === 0) throw new Error("Empty projection in CALL ... YIELD");
        return new CallProcedureYield(this, columns);
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const procedureCypher = this.procedure.getCypher(env);
        return `CALL ${procedureCypher}`;
    }
}

export interface CallProcedureYield extends WithReturn, WithWhere {}

@mixin(WithReturn, WithWhere)
export class CallProcedureYield extends Clause {
    private callProcedure: CallProcedure;
    private projection: Projection;

    constructor(call: CallProcedure, yieldColumns: Array<"*" | ProjectionColumn>) {
        super();
        this.callProcedure = call;

        const columns = asArray<ProjectionColumn | "*">(yieldColumns);
        this.projection = new Projection(columns);
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const callProcedureStr = this.callProcedure.getCypher(env);
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
