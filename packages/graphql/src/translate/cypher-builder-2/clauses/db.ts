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
import type { CypherEnvironment } from "../Environment";
import { Where, WhereParams } from "../sub-clauses/Where";
import type { NodeRef } from "../variables/NodeRef";
import { Clause } from "./Clause";
import { Return } from "./Return";

export class FullTextQueryNodes extends Clause {
    private targetNode: NodeRef;
    private indexName: string;
    private phrase: string;

    private whereClause: Where | undefined;
    private returnClause: Return | undefined;

    constructor(targetNode: NodeRef, indexName: string, phrase: string, parent?: Clause) {
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
        }
        // } else {
        //     // Avoids adding unneeded where statements
        //     this.whereStatement.addWhereParams(input);
        // }
        return this;
    }

    public cypher(env: CypherEnvironment): string {
        const targetId = env.getVariableId(this.targetNode);

        const whereStr = this.whereClause?.getCypher(env) || "";
        const returnStr = this.returnClause?.getCypher(env) || "";

        const textSearchStr = dedent`CALL db.index.fulltext.queryNodes(
            "${this.indexName}",
            $${this.phrase}
        ) YIELD node as ${targetId}`;

        return `${textSearchStr}\n
            ${whereStr}\n
            ${returnStr}
        `;
    }

    public return(node: NodeRef, fields?: string[], alias?: string): Return {
        // const returnStatement = new Return(this, [node, fields, alias]);
        this.returnClause = new Return([node, fields, alias]);
        this.addChildren(this.returnClause);
        // this.addStatement(returnStatement);
        return this.returnClause;
    }
}
