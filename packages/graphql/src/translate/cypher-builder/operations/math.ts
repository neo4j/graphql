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

import type { Expr } from "../types";
import type { CypherEnvironment } from "../Environment";
import { Operation } from "./Operation";

type MathOperator = "+" | "-";

export class MathOp extends Operation {
    private operator: MathOperator;
    private leftExpr: Expr;
    private rightExpr: Expr;

    constructor(operator: MathOperator, left: Expr, right: Expr) {
        super();
        this.operator = operator;
        this.leftExpr = left;
        this.rightExpr = right;
    }

    public getCypher(env: CypherEnvironment): string {
        const leftStr = this.leftExpr ? `${this.leftExpr.getCypher(env)} ` : "";
        const rightStr = this.rightExpr ? ` ${this.rightExpr.getCypher(env)}` : "";

        return `${leftStr}${this.operator}${rightStr}`;
    }
}

function createOp(op: MathOperator, leftExpr: Expr, rightExpr: Expr): MathOp {
    return new MathOp(op, leftExpr, rightExpr);
}

export function plus(leftExpr: Expr, rightExpr: Expr) {
    return createOp("+", leftExpr, rightExpr);
}
export function minus(leftExpr: Expr, rightExpr: Expr) {
    return createOp("-", leftExpr, rightExpr);
}
