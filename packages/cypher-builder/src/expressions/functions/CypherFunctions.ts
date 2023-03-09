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

import type { Variable } from "../../references/Variable";
import { CypherASTNode } from "../../CypherASTNode";
import type { CypherEnvironment } from "../../Environment";
import type { Expr } from "../../types";

/** Represents a Cypher Function
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/)
 * @group Expressions
 * @category Cypher Functions
 */
export class CypherFunction extends CypherASTNode {
    protected name: string;
    private params: Array<Expr>;

    constructor(name: string, params: Array<Expr> = []) {
        super();
        this.name = name;
        this.params = params;
        for (const param of params) {
            if (param instanceof CypherASTNode) {
                this.addChildren(param);
            }
        }
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const argsStr = this.params.map((expr) => expr.getCypher(env)).join(", ");

        return `${this.name}(${argsStr})`;
    }
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/scalar/#functions-coalesce)
 * @group Expressions
 * @category Cypher Functions
 */
export function coalesce(expr: Expr, ...optionalExpr: Expr[]): CypherFunction {
    return new CypherFunction("coalesce", [expr, ...optionalExpr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/spatial/)
 * @group Expressions
 * @category Cypher Functions
 */
export function point(variable: Expr): CypherFunction {
    return new CypherFunction("point", [variable]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/4.3/functions/spatial/#functions-distance)
 * @group Expressions
 * @category Cypher Functions
 * @deprecated No longer supported in Neo4j 5. Use {@link pointDistance} instead.
 */
export function distance(lexpr: Expr, rexpr: Expr): CypherFunction {
    return new CypherFunction("distance", [lexpr, rexpr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/spatial/#functions-distance)
 * @group Expressions
 * @category Cypher Functions
 */
export function pointDistance(lexpr: Expr, rexpr: Expr): CypherFunction {
    return new CypherFunction("point.distance", [lexpr, rexpr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/list/#functions-labels)
 * @group Expressions
 * @category Cypher Functions
 */
export function labels(nodeRef: Variable): CypherFunction {
    return new CypherFunction("labels", [nodeRef]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-count)
 * @group Expressions
 * @category Cypher Functions
 */
export function count(expr: Expr): CypherFunction {
    return new CypherFunction("count", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-min)
 * @group Expressions
 * @category Cypher Functions
 */
export function min(expr: Expr): CypherFunction {
    return new CypherFunction("min", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-max)
 * @group Expressions
 * @category Cypher Functions
 */
export function max(expr: Expr): CypherFunction {
    return new CypherFunction("max", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg)
 * @group Expressions
 * @category Cypher Functions
 */
export function avg(expr: Expr): CypherFunction {
    return new CypherFunction("avg", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-sum)
 * @group Expressions
 * @category Cypher Functions
 */
export function sum(expr: Expr): CypherFunction {
    return new CypherFunction("sum", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/scalar/#functions-randomuuid)
 * @group Expressions
 * @category Cypher Functions
 */
export function randomUUID(): CypherFunction {
    return new CypherFunction("randomUUID");
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/scalar/#functions-id)
 * @group Expressions
 * @category Cypher Functions
 */
export function id(variable: Expr): CypherFunction {
    return new CypherFunction("id", [variable]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/scalar/#functions-elementid)
 * @group Expressions
 * @category Cypher Functions
 */
export function elementId(variable: Expr): CypherFunction {
    return new CypherFunction("elementId", [variable]);
}
