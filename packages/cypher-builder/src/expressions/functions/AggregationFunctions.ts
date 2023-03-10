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

import type { CypherEnvironment } from "../../Environment";
import type { Expr } from "../../types";
import { CypherFunction } from "./CypherFunctions";

export class CypherAggregationFunction extends CypherFunction {
    private hasDistinct = false;

    /**
     * Adds DISTINCT to remove duplicates on the aggregation functions
     * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#_counting_with_and_without_duplicates)
     */
    public distinct(): this {
        this.hasDistinct = true;
        return this;
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const argsStr = this.serializeParams(env);
        const distinctStr = this.hasDistinct ? "DISTINCT " : "";

        return `${this.name}(${distinctStr}${argsStr})`;
    }
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-count)
 * @group Expressions
 * @category Cypher Functions
 */
export function count(expr: Expr): CypherAggregationFunction {
    return new CypherAggregationFunction("count", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-min)
 * @group Expressions
 * @category Cypher Functions
 */
export function min(expr: Expr): CypherAggregationFunction {
    return new CypherAggregationFunction("min", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-max)
 * @group Expressions
 * @category Cypher Functions
 */
export function max(expr: Expr): CypherAggregationFunction {
    return new CypherAggregationFunction("max", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg)
 * @group Expressions
 * @category Cypher Functions
 */
export function avg(expr: Expr): CypherAggregationFunction {
    return new CypherAggregationFunction("avg", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-sum)
 * @group Expressions
 * @category Cypher Functions
 */
export function sum(expr: Expr): CypherAggregationFunction {
    return new CypherAggregationFunction("sum", [expr]);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-collect)
 * @group Expressions
 * @category Cypher Functions
 */
export function collect(expr: Expr): CypherAggregationFunction {
    return new CypherAggregationFunction("collect", [expr]);
}
