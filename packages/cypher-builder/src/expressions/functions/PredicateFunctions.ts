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
import type { Pattern } from "../../pattern/Pattern";
import { Where } from "../../clauses/sub-clauses/Where";
import type { Expr, Predicate } from "../../types";
import { compileCypherIfExists } from "../../utils/compile-cypher-if-exists";
import type { Variable } from "../../references/Variable";
import { CypherFunction } from "./CypherFunction";

/** Represents a predicate function that can be used in a WHERE statement
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/predicate/)
 * @group Internal
 */
export class PredicateFunction extends CypherFunction {}

/** Predicate function that uses a list comprehension "var IN list WHERE .." */
class ListPredicateFunction extends PredicateFunction {
    private variable: Variable;
    private listExpr: Expr;
    private whereSubClause: Where | undefined;

    constructor(name: string, variable: Variable, listExpr: Expr, whereFilter?: Predicate) {
        super(name);
        this.variable = variable;
        this.listExpr = listExpr;

        if (whereFilter) {
            this.whereSubClause = new Where(this, whereFilter);
        }
    }

    getCypher(env: CypherEnvironment): string {
        const whereStr = compileCypherIfExists(this.whereSubClause, env, { prefix: " " });
        const listExprStr = this.listExpr.getCypher(env);
        const varCypher = this.variable.getCypher(env);

        return `${this.name}(${varCypher} IN ${listExprStr}${whereStr})`;
    }
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/predicate/#functions-any)
 * @group Expressions
 * @category Cypher Functions
 */
export function any(variable: Variable, listExpr: Expr, whereFilter?: Predicate): PredicateFunction {
    return new ListPredicateFunction("any", variable, listExpr, whereFilter);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/predicate/#functions-all)
 * @group Expressions
 * @category Cypher Functions
 */
export function all(variable: Variable, listExpr: Expr, whereFilter?: Predicate): PredicateFunction {
    return new ListPredicateFunction("all", variable, listExpr, whereFilter);
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/predicate/#functions-single)
 * @group Expressions
 * @category Cypher Functions
 */
export function single(variable: Variable, listExpr: Expr, whereFilter: Predicate): PredicateFunction {
    return new ListPredicateFunction("single", variable, listExpr, whereFilter);
}

class ExistsFunction extends PredicateFunction {
    private pattern: Pattern;

    constructor(pattern: Pattern) {
        super("exists");
        this.pattern = pattern;
    }

    getCypher(env: CypherEnvironment): string {
        const patternStr = this.pattern.getCypher(env);

        return `exists(${patternStr})`;
    }
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/functions/predicate/#functions-exists)
 * @group Expressions
 * @category Cypher Functions
 */
export function exists(pattern: Pattern): PredicateFunction {
    return new ExistsFunction(pattern);
}
