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
import { WithWith } from "./mixins/WithWith";
import { mixin } from "./utils/mixin";
import type { DeleteClause } from "./sub-clauses/Delete";
import type { SetClause } from "./sub-clauses/Set";
import type { RemoveClause } from "./sub-clauses/Remove";
import { padBlock } from "../utils/pad-block";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import type { Create } from "./Create";
import type { Merge } from "./Merge";
import type { Variable } from "../references/Variable";
import type { Expr } from "../types";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Foreach extends WithWith {}

// TODO: Set, Remove and Delete cannot be used as they are not directly exposed
type ForeachClauses = Foreach | SetClause | RemoveClause | Create | Merge | DeleteClause;

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/foreach/)
 * @group Clauses
 */
@mixin(WithWith)
export class Foreach extends Clause {
    private variable: Variable;
    private listExpr: Expr;
    private mapClause: ForeachClauses;

    constructor(variable: Variable, listExpr: Expr, mapClause: ForeachClauses) {
        super();
        this.variable = variable;
        this.listExpr = listExpr;
        this.mapClause = mapClause;
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const variableStr = this.variable.getCypher(env);
        const listExpr = this.listExpr.getCypher(env);
        const mapClauseStr = this.mapClause.getCypher(env);
        const withStr = compileCypherIfExists(this.withStatement, env, { prefix: "\n" });

        const foreachStr = [`FOREACH (${variableStr} IN ${listExpr} |`, padBlock(mapClauseStr), `)`].join("\n");

        return `${foreachStr}${withStr}`;
    }
}
