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
import { padBlock } from "../utils/pad-block";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import type { Expr, Predicate } from "../types";

/** Case statement
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/expressions/#query-syntax-case)
 * @group Expressions
 */
export class Case<C extends Expr | undefined = undefined> extends CypherASTNode {
    private comparator: Expr | undefined;
    private whenClauses: When<C>[] = [];
    private default: Expr | undefined;

    constructor(comparator?: C) {
        super();
        this.comparator = comparator;
    }

    public when(expr: C extends Expr ? Expr : Predicate): When<C> {
        const whenClause = new When(this, expr);
        this.whenClauses.push(whenClause);
        return whenClause;
    }

    public else(defaultExpr: Expr): this {
        this.default = defaultExpr;
        return this;
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const comparatorStr = compileCypherIfExists(this.comparator, env, { prefix: " " });
        const whenStr = this.whenClauses.map((c) => c.getCypher(env)).join("\n");
        const defaultStr = compileCypherIfExists(this.default, env, { prefix: "\nELSE " });

        const innerStr = padBlock(`${whenStr}${defaultStr}`);

        return `CASE${comparatorStr}\n${innerStr}\nEND`;
    }
}

class When<T extends Expr | undefined> extends CypherASTNode {
    protected parent: Case<T>;
    private predicate: Expr;
    private result: Expr | undefined;

    constructor(parent: Case<T>, predicate: Expr) {
        super();
        this.parent = parent;
        this.predicate = predicate;
    }

    public then(expr: Expr): Case<T> {
        this.result = expr;
        return this.parent;
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const predicateStr = this.predicate.getCypher(env);
        if (!this.result) throw new Error("Cannot generate CASE ... WHEN statement without THEN");
        const resultStr = this.result.getCypher(env);

        return `WHEN ${predicateStr} THEN ${resultStr}`;
    }
}
