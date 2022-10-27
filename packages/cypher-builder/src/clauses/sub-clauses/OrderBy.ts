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

import type { CypherEnvironment } from "../../Environment";

import { CypherASTNode } from "../../CypherASTNode";
import type { Expr } from "../../types";
import { compileCypherIfExists } from "../../utils/compile-cypher-if-exists";
import type { Param } from "../../variables/Param";
import type { Variable } from "../../variables/Variable";
import { normalizeVariable } from "../../utils/normalize-variable";
import type { Literal } from "../../variables/Literal";
import type { Integer } from "neo4j-driver";

export type Order = "ASC" | "DESC";

type OrderProjectionElement = [Expr, Order];

export class OrderBy extends CypherASTNode {
    private exprs: OrderProjectionElement[] = [];

    private skipClause: Skip | undefined;
    private limitClause: Limit | undefined;

    public addOrderElements(exprs: OrderProjectionElement[]): void {
        this.exprs.push(...exprs);
    }

    public skip(offset: number | Param<Integer> | Literal<number>): void {
        const offsetVar = normalizeVariable(offset);
        this.skipClause = new Skip(offsetVar);
    }

    public limit(limit: number | Param<Integer> | Literal<number>): void {
        const limitVar = normalizeVariable(limit);
        this.limitClause = new Limit(limitVar);
    }

    private hasOrder(): boolean {
        return this.exprs.length > 0;
    }

    public getCypher(env: CypherEnvironment): string {
        let orderStr = "";
        const skipStr = compileCypherIfExists(this.skipClause, env, { prefix: "\n" });
        const limitStr = compileCypherIfExists(this.limitClause, env, { prefix: "\n" });

        if (this.hasOrder()) {
            const exprStr = this.exprs
                .map(([expr, order]) => {
                    return `${expr.getCypher(env)} ${order}`;
                })
                .join(", ");

            orderStr = `ORDER BY ${exprStr}`;
        }

        return `${orderStr}${skipStr}${limitStr}`;
    }
}

class Skip extends CypherASTNode {
    private value: Variable | Param | Literal;

    constructor(value: Variable | Param | Literal) {
        super();
        this.value = value;
    }

    public getCypher(env: CypherEnvironment): string {
        const valueStr = this.value.getCypher(env);
        return `SKIP ${valueStr}`;
    }
}

class Limit extends CypherASTNode {
    private value: Variable | Param | Literal;

    constructor(value: Variable | Param | Literal) {
        super();
        this.value = value;
    }

    public getCypher(env: CypherEnvironment): string {
        const valueStr = this.value.getCypher(env);
        return `LIMIT ${valueStr}`;
    }
}
