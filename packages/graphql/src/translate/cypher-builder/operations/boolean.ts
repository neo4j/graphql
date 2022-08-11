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

import { filterTruthy } from "../../../utils/utils";
import type { CypherEnvironment } from "../Environment";
import type { Predicate } from "../types";
import { Operation } from "./Operation";

type BooleanOperator = "AND" | "NOT" | "OR";

export abstract class BooleanOp extends Operation {
    protected operator: BooleanOperator;

    constructor(operator: BooleanOperator) {
        super();
        this.operator = operator;
    }
}

class BinaryOp extends BooleanOp {
    private children: Predicate[];

    constructor(operator: BooleanOperator, left: Predicate, right: Predicate, ...extra: Predicate[]) {
        super(operator);
        this.children = [left, right, ...extra];
        this.addChildren(...this.children);
    }

    public getCypher(env: CypherEnvironment): string {
        const childrenStrs = this.children.map((c) => c.getCypher(env)).filter(Boolean);

        if (childrenStrs.length <= 1) {
            return childrenStrs.join("");
        }
        return `(${childrenStrs.join(` ${this.operator} `)})`;
    }
}

class NotOp extends BooleanOp {
    private child: Predicate;

    constructor(child: Predicate) {
        super("NOT");
        this.child = child;
        this.addChildren(this.child);
    }

    public getCypher(env: CypherEnvironment): string {
        const childStr = this.child.getCypher(env);

        // This check is just to avoid double parenthesis (e.g. "NOT ((a AND b))" ), both options are valid cypher
        if (this.child instanceof BinaryOp) {
            return `${this.operator} ${childStr}`;
        }

        return `${this.operator} (${childStr})`;
    }
}

export function and(left: Predicate, ...extra: Array<Predicate | undefined>): BooleanOp;
export function and(...ops: Array<Predicate | undefined>): BooleanOp | Predicate | undefined;
export function and(...ops: Array<Predicate | undefined>): BooleanOp | Predicate | undefined {
    const filteredOprs = filterTruthy(ops);
    const op1 = filteredOprs.shift();
    const op2 = filteredOprs.shift();
    if (op1 && op2) {
        return new BinaryOp("AND", op1, op2, ...filteredOprs);
    }
    return op1;
}

export function not(child: Predicate): BooleanOp {
    return new NotOp(child);
}

export function or(left: Predicate, ...extra: Array<Predicate | undefined>): BooleanOp;
export function or(...ops: Array<Predicate | undefined>): BooleanOp | Predicate | undefined;
export function or(...ops: Array<Predicate | undefined>): BooleanOp | Predicate | undefined {
    const filteredOprs = filterTruthy(ops);
    const op1 = filteredOprs.shift();
    const op2 = filteredOprs.shift();
    if (op1 && op2) {
        return new BinaryOp("OR", op1, op2, ...filteredOprs);
    }
    return op1;
}
