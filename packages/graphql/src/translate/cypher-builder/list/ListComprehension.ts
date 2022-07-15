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
import { Where, WhereParams } from "../sub-clauses/Where";
import type { Expr } from "../types";
import { compileCypherIfExists } from "../utils";
import type { Variable } from "../variables/Variable";
import { CypherList } from "./List";

export class ListComprehension extends CypherList {
    private where: Where | undefined;
    private variable: Variable;
    private listExpr: Expr;
    private mapExpr: Expr | undefined;

    constructor(variable: Variable, listExpr: Expr, whereFilter?: WhereParams | undefined, mapExpr?: Expr) {
        super();
        this.variable = variable;
        this.listExpr = listExpr;
        this.mapExpr = mapExpr;

        if (whereFilter) {
            this.where = new Where(undefined, whereFilter);
        }
    }

    getCypher(env: CypherEnvironment): string {
        const whereStr = compileCypherIfExists(this.where, env, { prefix: " " });
        const mapStr = compileCypherIfExists(this.mapExpr, env, { prefix: " | " });
        const listExprStr = this.listExpr.getCypher(env);
        const varCypher = this.variable.getCypher(env);

        return `[${varCypher} IN ${listExprStr}${whereStr}${mapStr}]`;
    }
}
