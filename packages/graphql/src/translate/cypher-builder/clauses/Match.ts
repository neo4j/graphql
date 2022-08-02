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

import type { CypherEnvironment } from "../Environment";
import { MatchableElement, MatchParams, Pattern } from "../Pattern";
import { Clause } from "./Clause";
import { compileCypherIfExists } from "../utils";
import { WithReturn } from "./mixins/WithReturn";
import { applyMixins } from "./utils/apply-mixin";
import { WithWhere } from "./mixins/WithWhere";
import { WithSet } from "./mixins/WithSet";
import { WithWith } from "./mixins/WithWith";

export class Match<T extends MatchableElement = any> extends Clause {
    private pattern: Pattern<T>;

    constructor(variable: T | Pattern<T>, parameters: MatchParams<T> = {}, parent?: Clause) {
        super(parent);
        if (variable instanceof Pattern) {
            this.pattern = variable;
        } else {
            this.pattern = new Pattern(variable).withParams(parameters);
        }
        this.addChildren(this.pattern);
    }

    public getCypher(env: CypherEnvironment): string {
        const nodeCypher = this.pattern.getCypher(env);

        const whereCypher = compileCypherIfExists(this.whereSubClause, env, { prefix: "\n" });
        const returnCypher = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });
        const setCypher = compileCypherIfExists(this.setSubClause, env, { prefix: "\n" });
        const withCypher = compileCypherIfExists(this.withStatement, env, { prefix: "\n" });

        return `MATCH ${nodeCypher}${whereCypher}${setCypher}${withCypher}${returnCypher}`;
    }
}

export interface Match extends WithReturn, WithWhere, WithSet, WithWith {}
applyMixins(Match, [WithReturn, WithWhere, WithSet, WithWith]);
