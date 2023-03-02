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

import type { Expr } from "../../types";
import type { CypherEnvironment } from "../../Environment";
import { CypherASTNode } from "../../CypherASTNode";

type MathOperator = "+" | "-" | "*", "/", "%", "^";

export class MathOp extends CypherASTNode {
    private operator: MathOperator;
    private exprs: Expr[];

    constructor(operator: MathOperator, exprs: Expr[] = []) {
        super();
        this.operator = operator;
        this.exprs = exprs;
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const exprs = this.exprs.map((e) => e.getCypher(env));

        return exprs.join(` ${this.operator} `);
    }
}

function createOp(op: MathOperator, exprs: Expr[]): MathOp {
    return new MathOp(op, exprs);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/operators/#query-operators-mathematical)
 * @see [String Concatenation](https://neo4j.com/docs/cypher-manual/current/syntax/operators/#syntax-concatenating-two-strings)
 * @group Expressions
 * @category Operators
 */
export function plus(leftExpr: Expr, rightExpr: Expr): MathOp;
export function plus(...exprs: Expr[]): MathOp;
export function plus(...exprs: Expr[]): MathOp {
    return createOp("+", exprs);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/operators/#query-operators-mathematical)
 * @group Expressions
 * @category Operators
 */
export function minus(leftExpr: Expr, rightExpr: Expr): MathOp {
    return createOp("-", [leftExpr, rightExpr]);
}
