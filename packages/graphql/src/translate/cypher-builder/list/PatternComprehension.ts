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

import { WithWhere } from "../clauses/mixins/WithWhere";
import { applyMixins } from "../clauses/utils/apply-mixin";
import type { CypherEnvironment } from "../Environment";
import { MatchableElement, Pattern } from "../Pattern";
import type { Expr } from "../types";
import { compileCypherIfExists } from "../utils";
import { ComprehensionExpr } from "./ComprehensionExpr";

export class PatternComprehension extends ComprehensionExpr {
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

export interface PatternComprehension extends WithWhere {}
applyMixins(PatternComprehension, [WithWhere]);
