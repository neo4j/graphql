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

type StringOperator = "+";

export class StringOp extends CypherASTNode {
    private operator: StringOperator;
    private exprs: Expr[];

    constructor(operator: StringOperator, exprs: Expr[] = []) {
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

/**
 * @see [String Concatenation](https://neo4j.com/docs/cypher-manual/current/syntax/operators/#syntax-concatenating-two-strings)
 * @group Expressions
 * @category Operators
 */
export function concat(leftExpr: Expr, rightExpr: Expr, ...exprs: Expr[]): StringOp {
    return new StringOp("+", [leftExpr, rightExpr, ...exprs]);
}
