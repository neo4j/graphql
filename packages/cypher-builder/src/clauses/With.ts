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
import { Projection } from "./sub-clauses/Projection";
import type { Expr } from "../types";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import type { Literal } from "../references/Literal";
import type { Variable } from "../references/Variable";
import { Clause } from "./Clause";
import { WithOrder } from "./mixins/WithOrder";
import { WithReturn } from "./mixins/WithReturn";
import { WithWhere } from "./mixins/WithWhere";
import { mixin } from "./utils/mixin";

// With requires an alias for expressions that are not variables
export type WithProjection = Variable | [Expr, string | Variable | Literal];

export interface With extends WithOrder, WithReturn, WithWhere {}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/with/)
 * @group Clauses
 */
@mixin(WithOrder, WithReturn, WithWhere)
export class With extends Clause {
    private projection: Projection;
    private isDistinct = false;
    private withStatement: With | undefined;

    constructor(...columns: Array<"*" | WithProjection>) {
        super();
        this.projection = new Projection(columns);
    }

    public addColumns(...columns: Array<"*" | WithProjection>): this {
        this.projection.addColumns(columns);
        return this;
    }

    public distinct(): this {
        this.isDistinct = true;
        return this;
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const projectionStr = this.projection.getCypher(env);
        const orderByStr = compileCypherIfExists(this.orderByStatement, env, { prefix: "\n" });
        const returnStr = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });
        const withStr = compileCypherIfExists(this.withStatement, env, { prefix: "\n" });
        const whereStr = compileCypherIfExists(this.whereSubClause, env, { prefix: "\n" });
        const distinctStr = this.isDistinct ? " DISTINCT" : "";

        return `WITH${distinctStr} ${projectionStr}${whereStr}${orderByStr}${withStr}${returnStr}`;
    }

    // Cannot be part of WithWith due to dependency cycles
    public with(...columns: ("*" | WithProjection)[]): With {
        if (this.withStatement) {
            this.withStatement.addColumns(...columns);
        } else {
            this.withStatement = new With(...columns);
            this.addChildren(this.withStatement);
        }
        return this.withStatement;
    }
}
