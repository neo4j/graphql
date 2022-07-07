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

import { Expr } from "../types";
import { Operation } from "./Operation";
import { CypherEnvironment } from "../Environment";

type ComparisonOperator = "=" | "<" | ">" | "<>" | "<=" | ">=" | "IS NULL" | "IS NOT NULL";

export abstract class ComparisonOp extends Operation {
    protected operator: ComparisonOperator;

    constructor(operator: ComparisonOperator) {
        super();
        this.operator = operator;
    }
}

class BinaryComparisonOp extends ComparisonOp {
    private leftExpr: Expr;
    private rightExpr: Expr;

    constructor(operator: ComparisonOperator, leftExpr: Expr, rightExpr: Expr) {
        super(operator);
        this.operator = operator;
        this.leftExpr = leftExpr;
        this.rightExpr = rightExpr;
        // this.addChildren(this.leftExpr, this.rightExpr);
    }

    protected cypher(env: CypherEnvironment): string {
        const leftStr = this.leftExpr.getCypher(env);
        const rightStr = this.rightExpr.getCypher(env);

        return `${leftStr} ${this.operator} ${rightStr}`;
    }
}

class UnaryComparisonOp extends ComparisonOp {
    private child: Expr;

    constructor(operator: ComparisonOperator, child: Expr) {
        super(operator);
        this.child = child;
        // this.addChildren(this.child);
    }

    protected cypher(_env: CypherEnvironment): string {
        return `${this.operator}`;
    }
}

function createBinary(op: ComparisonOperator, leftExpr: Expr, rightExpr: Expr): BinaryComparisonOp {
    return new BinaryComparisonOp(op, leftExpr, rightExpr);
}
function createUnary(op: ComparisonOperator, childExpr: Expr): UnaryComparisonOp {
    return new UnaryComparisonOp(op, childExpr);
}

export function eq(leftExpr: Expr, rightExpr: Expr) {
    return createBinary("=", leftExpr, rightExpr);
}

export function gt(leftExpr: Expr, rightExpr: Expr) {
    return createBinary(">", leftExpr, rightExpr);
}

export function gte(leftExpr: Expr, rightExpr: Expr) {
    return createBinary(">=", leftExpr, rightExpr);
}

export function lt(leftExpr: Expr, rightExpr: Expr) {
    return createBinary("<", leftExpr, rightExpr);
}

export function lte(leftExpr: Expr, rightExpr: Expr) {
    return createBinary("<=", leftExpr, rightExpr);
}

export function isNull(childExpr: Expr) {
    return createUnary("IS NULL", childExpr);
}

export function isNotNull(childExpr: Expr) {
    return createUnary("IS NOT NULL", childExpr);
}
