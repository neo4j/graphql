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

import type { Exists, RawCypher } from "../CypherBuilder";
import type { CypherEnvironment } from "../Environment";
import type { ComparisonOp } from "./comparison";
import { Operation } from "./Operation";

type BooleanOperator = "AND" | "NOT" | "OR";

type BooleanOpChild = BooleanOp | ComparisonOp | RawCypher | Exists;

export abstract class BooleanOp extends Operation {
    protected operator: BooleanOperator;

    constructor(operator: BooleanOperator) {
        super();
        this.operator = operator;
    }
}

class BinaryOp extends BooleanOp {
    private children: BooleanOpChild[];

    constructor(operator: BooleanOperator, left: BooleanOpChild, right: BooleanOpChild, ...extra: BooleanOpChild[]) {
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
    private child: BooleanOpChild;

    constructor(child: BooleanOpChild) {
        super("NOT");
        this.child = child;
        this.addChildren(this.child);
    }

    public getCypher(env: CypherEnvironment): string {
        const childStr = this.child.getCypher(env);
        return `${this.operator} ${childStr}`;
    }
}

export function and(left: BooleanOpChild, right: BooleanOpChild, ...extra: BooleanOpChild[]): BooleanOp;
export function and(...ops: BooleanOpChild[]): BooleanOpChild | BooleanOp | undefined;
export function and(...ops: BooleanOpChild[]): BooleanOp | BooleanOpChild | undefined {
    const op1 = ops.shift();
    const op2 = ops.shift();
    if (op1 && op2) {
        return new BinaryOp("AND", op1, op2, ...ops);
    }
    return op1;
}

export function not(child: BooleanOpChild): BooleanOp {
    return new NotOp(child);
}

export function or(left: BooleanOpChild, right: BooleanOpChild, ...extra: BooleanOpChild[]): BooleanOp;
export function or(...ops: BooleanOpChild[]): BooleanOpChild | BooleanOp | undefined;
export function or(...ops: BooleanOpChild[]): BooleanOp | BooleanOpChild | undefined {
    const op1 = ops.shift();
    const op2 = ops.shift();
    if (op1 && op2) {
        return new BinaryOp("OR", op1, op2, ...ops);
    }
    return op1;
}
