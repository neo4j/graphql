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
import { CypherASTNode } from "../CypherASTNode";
import { compileCypherIfExists, padBlock } from "../utils";
import type { Expr } from "../types";

// TODO: implement generic CASE without comparator
export class Case extends CypherASTNode {
    private comparator: Expr;
    private whenClauses: When[] = [];
    private default: Expr | undefined;

    constructor(comparator: Expr) {
        super();
        this.comparator = comparator;
    }

    public when(expr: Expr): When {
        const whenClause = new When(this, expr);
        this.whenClauses.push(whenClause);
        return whenClause;
    }

    public else(defaultExpr: Expr): this {
        this.default = defaultExpr;
        return this;
    }

    public getCypher(env: CypherEnvironment): string {
        const comparatorStr = this.comparator.getCypher(env);
        const whenStr = this.whenClauses.map((c) => c.getCypher(env)).join("\n");
        const defaultStr = compileCypherIfExists(this.default, env, { prefix: "\nELSE " });

        const innerStr = padBlock(`${whenStr}${defaultStr}`);

        return `CASE ${comparatorStr}\n${innerStr}\nEND`;
    }
}

class When extends CypherASTNode {
    protected parent: Case;
    private predicate: Expr;
    private result: Expr | undefined;

    constructor(parent: Case, predicate: Expr) {
        super();
        this.parent = parent;
        this.predicate = predicate;
    }

    public then(expr: Expr): Case {
        this.result = expr;
        return this.parent;
    }

    public getCypher(env: CypherEnvironment): string {
        const predicateStr = this.predicate.getCypher(env);
        if (!this.result) throw new Error("Cannot generate CASE ... WHEN statement without THEN");
        const resultStr = this.result.getCypher(env);

        return `WHEN ${predicateStr} THEN ${resultStr}`;
    }
}
