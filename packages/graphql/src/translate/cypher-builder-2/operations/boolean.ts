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

import { CypherContext } from "../../cypher-builder/CypherContext";
import { ComparisonOp } from "./comparison";
import { Operation } from "./Operation";

type BooleanOperator = "AND" | "NOT" | "OR";

type BooleanOpChild = BooleanOp | ComparisonOp;

export abstract class BooleanOp extends Operation {
    protected operator: BooleanOperator;

    constructor(operator: BooleanOperator) {
        super();
        this.operator = operator;
    }
}

class BinaryOp extends BooleanOp {
    private left: BooleanOpChild;
    private right: BooleanOpChild;

    constructor(operator: BooleanOperator, left: BooleanOpChild, right: BooleanOpChild) {
        super(operator);
        this.addChildren(left, right);
        this.left = left;
        this.right = right;
    }

    protected cypher(context: CypherContext, _childrenCypher: string): string {
        const leftCypher = this.left.getCypher(context);
        const rightCypher = this.right.getCypher(context);

        return `(${leftCypher} ${this.operator} ${rightCypher})`;
    }
}

class NotOp extends BooleanOp {
    constructor(child: BooleanOpChild) {
        super("NOT");
        this.addASTNode(child);
    }

    protected cypher(_context: CypherContext, childrenCypher: string): string {
        return `${this.operator} ${childrenCypher}`;
    }
}

export function and(left: BooleanOpChild, right: BooleanOpChild): BooleanOp {
    return new BinaryOp("AND", left, right);
}

export function not(child: BooleanOpChild): BooleanOp {
    return new NotOp(child);
}

export function or(left: BooleanOpChild, right: BooleanOpChild): BooleanOp {
    return new BinaryOp("OR", left, right);
}
