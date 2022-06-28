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

import { CypherASTNode } from "../CypherASTNode";
import { CypherContext } from "../CypherContext";
import { Node } from "../references/Node";

export type ReturnStatementArgs = [Node, Array<string>?, string?];

export class ReturnStatement extends CypherASTNode {
    private returnArgs: ReturnStatementArgs;

    constructor(parent: CypherASTNode, args: ReturnStatementArgs) {
        super(parent);
        this.returnArgs = args;
    }

    public cypher(context: CypherContext): string {
        let projection = "";
        let alias = "";
        if ((this.returnArgs[1] || []).length > 0) {
            projection = ` {${(this.returnArgs[1] as Array<string>).map((s) => `.${s}`).join(", ")}}`;
        }

        if ((this.returnArgs[2] || []).length > 0) {
            alias = ` AS ${this.returnArgs[2]}`;
        }
        const nodeAlias = context.getVariableId(this.returnArgs[0]);

        return `RETURN ${nodeAlias}${projection}${alias}`;
    }
}
