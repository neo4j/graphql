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
import { compileCypherIfExists } from "../../utils/utils";

export type Order = "ASC" | "DESC";

type OrderProjectionElement = [Expr, Order];

export class OrderBy extends CypherASTNode {
    private exprs: OrderProjectionElement[] = [];

    private skipClause: Skip | undefined;
    private limitClause: Limit | undefined;

    public addOrderElements(exprs: OrderProjectionElement[]): void {
        this.exprs.push(...exprs);
    }

    public skip(offset: number): void {
        this.skipClause = new Skip(offset);
    }

    public limit(limit: number): void {
        this.limitClause = new Limit(limit);
    }

    private hasOrder(): boolean {
        return this.exprs.length > 0;
    }

    public getCypher(env: CypherEnvironment): string {
        let orderStr = "";
        const limitStr = compileCypherIfExists(this.limitClause, env, { prefix: "\n" });
        const skipStr = compileCypherIfExists(this.skipClause, env, { prefix: "\n" });

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
    private value: number;

    constructor(value: number) {
        super();
        this.value = value;
    }

    public getCypher(env: CypherEnvironment): string {
        return `SKIP ${this.value}`;
    }
}

class Limit extends CypherASTNode {
    private value: number;

    constructor(value: number) {
        super();
        this.value = value;
    }

    public getCypher(env: CypherEnvironment): string {
        return `LIMIT ${this.value}`;
    }
}
