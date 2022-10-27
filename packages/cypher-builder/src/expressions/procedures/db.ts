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
import { Where } from "../../clauses/sub-clauses/Where";
import type { NodeRef } from "../../variables/NodeRef";
import { Clause } from "../../clauses/Clause";
import { WithReturn } from "../../clauses/mixins/WithReturn";
import { mixin } from "../../clauses/utils/mixin";
import type { Variable } from "../../variables/Variable";
import type { Predicate } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FullTextQueryNodes extends WithReturn {}

@mixin(WithReturn)
export class FullTextQueryNodes extends Clause {
    private targetNode: NodeRef;
    private indexName: string;
    private phrase: Variable;

    private whereClause: Where | undefined;

    constructor(targetNode: NodeRef, indexName: string, phrase: Variable, parent?: Clause) {
        super(parent);
        this.targetNode = targetNode;
        this.indexName = indexName;
        this.phrase = phrase;
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
        const targetId = env.getReferenceId(this.targetNode);

        const whereStr = this.whereClause?.getCypher(env) || "";
        const returnStr = this.returnStatement?.getCypher(env) || "";

        // TODO: dendent
        const textSearchStr = `CALL db.index.fulltext.queryNodes(
            "${this.indexName}",
            ${this.phrase.getCypher(env)}
        ) YIELD node as ${targetId}`;

        return `${textSearchStr}\n
            ${whereStr}\n
            ${returnStr}
        `;
    }
}
