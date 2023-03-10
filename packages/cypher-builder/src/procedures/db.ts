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
import { Where } from "../clauses/sub-clauses/Where";
import type { NodeRef } from "../references/NodeRef";
import { Clause } from "../clauses/Clause";
import { WithReturn } from "../clauses/mixins/WithReturn";
import { mixin } from "../clauses/utils/mixin";
import type { Variable } from "../references/Variable";
import type { Predicate } from "../types";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import { CypherProcedure } from "./CypherProcedure";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FullTextQueryNodes extends WithReturn {}

// TODO: remove yield and CALL and put them in CallProcedure
/**
 * @group Procedures
 */
@mixin(WithReturn)
export class FullTextQueryNodes extends Clause {
    // TODO: this should be a function and use the call procedure yield instead
    private targetNode: NodeRef;
    private indexName: string;
    private phrase: Variable;
    private scoreVar: Variable | undefined;
    private whereClause: Where | undefined;

    constructor(targetNode: NodeRef, indexName: string, phrase: Variable, scoreVar?: Variable, parent?: Clause) {
        super(parent);
        this.targetNode = targetNode;
        this.indexName = indexName;
        this.phrase = phrase;
        this.scoreVar = scoreVar;
    }

    public where(input: Predicate): this {
        if (!this.whereClause) {
            const whereStatement = new Where(this, input);
            this.addChildren(whereStatement);
            this.whereClause = whereStatement;
        } else {
            this.whereClause.and(input);
        }
        return this;
    }

    public getCypher(env: CypherEnvironment): string {
        const targetId = this.targetNode.getCypher(env);
        const scoreYield = compileCypherIfExists(this.scoreVar, env, { prefix: ", score AS " });

        const textSearchStr = `CALL db.index.fulltext.queryNodes("${this.indexName}", ${this.phrase.getCypher(
            env
        )}) YIELD node AS ${targetId}${scoreYield}`;

        const whereStr = compileCypherIfExists(this.whereClause, env, { prefix: "\n" });
        const returnStr = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });

        return `${textSearchStr}${whereStr}${returnStr}`;
    }
}

export function labels(): CypherProcedure {
    return new CypherProcedure("db.labels");
}
