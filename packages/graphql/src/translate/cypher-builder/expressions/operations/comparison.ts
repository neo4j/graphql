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

type ComparisonOperator =
    | "="
    | "<"
    | ">"
    | "<>"
    | "<="
    | ">="
    | "IS NULL"
    | "IS NOT NULL"
    | "IN"
    | "CONTAINS"
    | "STARTS WITH"
    | "ENDS WITH"
    | "=~";

export class ComparisonOp extends CypherASTNode {
    private operator: ComparisonOperator;
    private leftExpr: Expr | undefined;
    private rightExpr: Expr | undefined;

    constructor(operator: ComparisonOperator, left: Expr | undefined, right: Expr | undefined) {
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

function createOp(op: ComparisonOperator, leftExpr: Expr | undefined, rightExpr?: Expr): ComparisonOp {
    return new ComparisonOp(op, leftExpr, rightExpr);
}

export function eq(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("=", leftExpr, rightExpr);
}

export function gt(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp(">", leftExpr, rightExpr);
}

export function gte(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp(">=", leftExpr, rightExpr);
}

export function lt(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("<", leftExpr, rightExpr);
}

export function lte(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("<=", leftExpr, rightExpr);
}

export function isNull(childExpr: Expr): ComparisonOp {
    return createOp("IS NULL", childExpr);
}

export function isNotNull(childExpr: Expr): ComparisonOp {
    return createOp("IS NOT NULL", childExpr);
}

/* Below are operators that are not technically comparison, but can be treated as such */

export function inOp(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("IN", leftExpr, rightExpr);
}

export function contains(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("CONTAINS", leftExpr, rightExpr);
}
export function startsWith(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("STARTS WITH", leftExpr, rightExpr);
}
export function endsWith(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("ENDS WITH", leftExpr, rightExpr);
}
export function matches(leftExpr: Expr, rightExpr: Expr): ComparisonOp {
    return createOp("=~", leftExpr, rightExpr);
}
