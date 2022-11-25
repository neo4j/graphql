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
import type { CypherASTNode } from "../CypherASTNode";
import type { Variable } from "../references/Variable";
import { Clause } from "./Clause";
import { padBlock } from "../utils/pad-block";
import { ImportWith } from "./sub-clauses/ImportWith";
import { WithReturn } from "./mixins/WithReturn";
import { mixin } from "./utils/mixin";
import { WithWith } from "./mixins/WithWith";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";

export interface Call extends WithReturn, WithWith {}

@mixin(WithReturn, WithWith)
export class Call extends Clause {
    private subQuery: CypherASTNode;
    private importWith: ImportWith | undefined;

    constructor(subQuery: Clause) {
        super();
        const rootQuery = subQuery.getRoot();
        this.addChildren(rootQuery);
        this.subQuery = rootQuery;
    }

    public innerWith(...params: Variable[]): this {
        if (this.importWith) throw new Error("Call import already set");
        this.importWith = new ImportWith(this, params);
        this.addChildren(this.importWith);
        return this;
    }

    public getCypher(env: CypherEnvironment): string {
        const subQueryStr = this.subQuery.getCypher(env);
        const innerWithCypher = compileCypherIfExists(this.importWith, env, { suffix: "\n" });
        const returnCypher = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });
        const withCypher = compileCypherIfExists(this.withStatement, env, { prefix: "\n" });
        const inCallBlock = `${innerWithCypher}${subQueryStr}`;

        return `CALL {\n${padBlock(inCallBlock)}\n}${withCypher}${returnCypher}`;
    }
}
