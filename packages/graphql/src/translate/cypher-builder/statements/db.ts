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
import type { CypherContext } from "../CypherContext";
import type { Node } from "../references/Node";
import type { WhereInput } from "./Where";
import { Query } from "./Query";
import { ReturnStatement } from "./Return";
import { WhereStatement } from "./Where";

export class FullTextQueryNodes extends Query {
    private whereStatement: WhereStatement | undefined;
    private targetNode: Node;
    private indexName: string;
    private phrase: string;

    constructor(targetNode: Node, indexName: string, phrase: string, parent?: Query) {
        super(parent);
        this.targetNode = targetNode;
        this.indexName = indexName;
        this.phrase = phrase;
    }

    public where(...input: WhereInput): this {
        if (!this.whereStatement) {
            const whereStatement = new WhereStatement(this, input);
            this.addStatement(whereStatement);
            this.whereStatement = whereStatement;
        } else {
            // Avoids adding unneeded where statements
            this.whereStatement.addWhereParams(input);
        }
        return this;
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        const targetId = context.getVariableId(this.targetNode);

        const textSearchStr = dedent`CALL db.index.fulltext.queryNodes(
            "${this.indexName}",
            $${this.phrase}
        ) YIELD node as ${targetId}`;

        return `${textSearchStr}\n${childrenCypher}`;
    }

    public return(node: Node, fields?: string[], alias?: string): this {
        const returnStatement = new ReturnStatement(this, [node, fields, alias]);
        this.addStatement(returnStatement);
        return this;
    }
}
