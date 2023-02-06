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

import { WithWhere } from "../../clauses/mixins/WithWhere";
import { mixin } from "../../clauses/utils/mixin";
import { CypherASTNode } from "../../CypherASTNode";
import type { CypherEnvironment } from "../../Environment";
import { MatchableElement, Pattern } from "../../pattern/Pattern";
import type { Expr } from "../../types";
import { compileCypherIfExists } from "../../utils/compile-cypher-if-exists";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PatternComprehension extends WithWhere {}

/** Represents a Pattern comprehension
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/lists/#cypher-pattern-comprehension)
 * @group Expressions
 */
@mixin(WithWhere)
export class PatternComprehension extends CypherASTNode {
    private pattern: Pattern;
    private mapExpr: Expr | undefined;

    constructor(pattern: Pattern | MatchableElement, mapExpr?: Expr) {
        super();
        if (pattern instanceof Pattern) {
            this.pattern = pattern;
        } else {
            this.pattern = new Pattern(pattern);
        }
        this.mapExpr = mapExpr;
    }

    getCypher(env: CypherEnvironment): string {
        const whereStr = compileCypherIfExists(this.whereSubClause, env, { prefix: " " });
        const mapStr = compileCypherIfExists(this.mapExpr, env, { prefix: " | " });
        const patternStr = this.pattern.getCypher(env);

        return `[${patternStr}${whereStr}${mapStr}]`;
    }
}
