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

import { dedent } from "graphql-compose";
import type { Variable } from "../../CypherBuilder";
import type { CypherEnvironment } from "../../Environment";
import { Where, WhereParams } from "../../sub-clauses/Where";
import type { NodeRef } from "../../variables/NodeRef";
import { Clause } from "../Clause";
import { WithReturn } from "../mixins/WithReturn";
import { applyMixins } from "../utils/apply-mixin";

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

    public where(input: WhereParams): this {
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
        const targetId = env.getVariableId(this.targetNode);

        const whereStr = this.whereClause?.getCypher(env) || "";
        const returnStr = this.returnStatement?.getCypher(env) || "";

        const textSearchStr = dedent`CALL db.index.fulltext.queryNodes(
            "${this.indexName}",
            ${this.phrase.getCypher(env)}
        ) YIELD node as ${targetId}`;

        return `${textSearchStr}\n
            ${whereStr}\n
            ${returnStr}
        `;
    }
}

export interface FullTextQueryNodes extends WithReturn {}
applyMixins(FullTextQueryNodes, [WithReturn]);
