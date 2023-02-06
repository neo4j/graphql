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
import { Pattern } from "../pattern/Pattern";
import { Clause } from "./Clause";
import { OnCreate, OnCreateParam } from "./sub-clauses/OnCreate";
import { WithReturn } from "./mixins/WithReturn";
import { mixin } from "./utils/mixin";
import { WithSet } from "./mixins/WithSet";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import type { NodeRef } from "../references/NodeRef";

export interface Merge extends WithReturn, WithSet {}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/merge/)
 * @group Clauses
 */
@mixin(WithReturn, WithSet)
export class Merge extends Clause {
    private pattern: Pattern;
    private onCreateClause: OnCreate;

    constructor(pattern: NodeRef | Pattern) {
        super();

        if (pattern instanceof Pattern) {
            this.pattern = pattern;
        } else {
            this.pattern = pattern.pattern();
        }

        this.onCreateClause = new OnCreate(this);
    }

    public onCreate(...onCreateParams: OnCreateParam[]): this {
        this.onCreateClause.addParams(...onCreateParams);

        return this;
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const mergeStr = `MERGE ${this.pattern.getCypher(env)}`;
        const setCypher = compileCypherIfExists(this.setSubClause, env, { prefix: "\n" });
        const onCreateStr = compileCypherIfExists(this.onCreateClause, env, { prefix: "\n" });
        const returnStr = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });

        return `${mergeStr}${setCypher}${onCreateStr}${returnStr}`;
    }
}
