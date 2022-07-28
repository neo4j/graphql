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
import type { NodeRef } from "../variables/NodeRef";
import type { Param } from "../variables/Param";
import { Pattern } from "../Pattern";
import { SetClause } from "../sub-clauses/Set";
import { Clause } from "./Clause";
import { compileCypherIfExists } from "../utils";
import { WithReturn } from "./mixins/WithReturn";
import { applyMixins } from "./utils/apply-mixin";
import { WithSet } from "./mixins/WithSet";

type Params = Record<string, Param<any>>;

export class Create extends Clause {
    private pattern: Pattern<NodeRef>;

    constructor(node: NodeRef, params: Params = {}, parent?: Clause) {
        super(parent);
        this.pattern = new Pattern(node).withParams(params);
        this.addChildren(this.pattern);
        this.setSubClause = new SetClause(this);
    }

    public getCypher(env: CypherEnvironment): string {
        const nodeCypher = this.pattern.getCypher(env);

        const setCypher = compileCypherIfExists(this.setSubClause, env, { prefix: "\n" });
        const returnCypher = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });

        return `CREATE ${nodeCypher}${setCypher}${returnCypher}`;
    }
}

export interface Create extends WithReturn, WithSet {}
applyMixins(Create, [WithReturn, WithSet]);
